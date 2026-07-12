import { Octokit } from '@octokit/rest';
import { canonicalHash } from '../pipeline/idempotency';
import { Errors } from '../pipeline/errors';

export class GitHubAdapter {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  async createOrGetRepo(owner: string, name: string, visibility: 'private' | 'public' = 'private') {
    try {
      const existing = await this.octokit.repos.get({ owner, repo: name });
      return { created: false, repo: existing.data, receipt: canonicalHash({ owner, name, action: 'get_repo' }) };
    } catch (e: any) {
      if (e.status !== 404) throw Errors.providerTransient('github', e);
      const created = await this.octokit.repos.createInOrg({ org: owner, name, visibility, auto_init: true });
      return { created: true, repo: created.data, receipt: canonicalHash({ owner, name, action: 'create_repo' }) };
    }
  }

  async createBranch(owner: string, repo: string, branch: string, fromSha: string) {
    await this.octokit.git.createRef({ owner, repo, ref: `refs/heads/${branch}`, sha: fromSha });
    return { branch, sha: fromSha, receipt: canonicalHash({ owner, repo, branch, fromSha }) };
  }

  async writeFile(owner: string, repo: string, branch: string, path: string, content: string, message: string) {
    let sha: string | undefined;
    try {
      const existing = await this.octokit.repos.getContent({ owner, repo, path, ref: branch });
      sha = (existing.data as any).sha;
    } catch {}
    const res = await this.octokit.repos.createOrUpdateFileContents({
      owner, repo, path, message, branch,
      content: Buffer.from(content).toString('base64'),
      ...(sha ? { sha } : {})
    });
    return { path, sha: (res.data.content as any)?.sha, receipt: canonicalHash({ owner, repo, path, content }) };
  }

  async openDraftPR(owner: string, repo: string, head: string, base: string, title: string, body: string) {
    const pr = await this.octokit.pulls.create({ owner, repo, head, base, title, body, draft: true });
    return { pr_number: pr.data.number, url: pr.data.html_url, receipt: canonicalHash({ owner, repo, head, base }) };
  }
}