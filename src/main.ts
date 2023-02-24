import * as github from '@actions/github';
import * as core from '@actions/core';

interface PullRequest {
  title: string;
  body: string;
  number: number;
  html_url: string;
  labels: string[] | null;
  assignees: string[] | null;
}

async function run(): Promise<void> {
  try {
    const pull = await getMergedPullRequest(
      core.getInput('github_token'),
      github.context.repo.owner,
      github.context.repo.repo,
      github.context.sha
    );
    if (!pull) {
      core.debug('pull request not found');
      return;
    }

    core.setOutput('title', pull.title);
    core.setOutput('body', pull.body);
    core.setOutput('number', pull.number);
    core.setOutput('html_url', pull.html_url);
    core.setOutput('labels', pull.labels?.join('\n'));
    core.setOutput('assignees', pull.assignees?.join('\n'));
  } catch (e) {
    core.error(e);
    core.setFailed(e.message);
  }
}

async function getMergedPullRequest(
  githubToken: string,
  owner: string,
  repo: string,
  sha: string
): Promise<PullRequest | null> {
  const octokit = github.getOctokit(githubToken);

  const resp = await octokit.rest.pulls.list({
    owner,
    repo,
    sort: 'updated',
    direction: 'desc',
    state: 'closed',
    per_page: 100
  });

  const pull = resp.data.find(p => p.merge_commit_sha === sha);
  if (!pull) {
    return null;
  }

  return {
    title: pull.title,
    body: pull.body as string,
    number: pull.number,
    html_url: pull.html_url,
    labels: pull.labels.map(l => l.name as string),
    assignees: pull.assignees!.map(a => a.login)
  };
}

run();
