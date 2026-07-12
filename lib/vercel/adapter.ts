import { canonicalHash } from '../pipeline/idempotency';
import { Errors } from '../pipeline/errors';

export class VercelAdapter {
  private token: string;
  private teamId: string;
  private baseUrl = 'https://api.vercel.com';

  constructor(token: string, teamId: string) {
    this.token = token;
    this.teamId = teamId;
  }

  private async fetch(path: string, method = 'GET', body?: unknown) {
    const res = await fetch(`${this.baseUrl}${path}?teamId=${this.teamId}`, {
      method,
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    if (!res.ok) throw Errors.providerTransient('vercel', await res.text());
    return res.json();
  }

  async createProject(name: string, framework = 'nextjs', rootDirectory = '.') {
    const project = await this.fetch('/v9/projects', 'POST', { name, framework, rootDirectory });
    return { project_id: project.id, url: project.link?.repoUrl, receipt: canonicalHash({ name, framework, action: 'create_project' }) };
  }

  async deployFromGit(projectId: string, ref: string, sha: string) {
    const deployment = await this.fetch('/v13/deployments', 'POST', {
      project: projectId, target: 'preview',
      gitSource: { type: 'github', ref, sha }
    });
    return { deployment_id: deployment.id, url: `https://${deployment.url}`, receipt: canonicalHash({ projectId, ref, sha }) };
  }

  async getDeploymentStatus(deploymentId: string) {
    const dep = await this.fetch(`/v13/deployments/${deploymentId}`);
    return { state: dep.readyState, url: `https://${dep.url}` };
  }
}