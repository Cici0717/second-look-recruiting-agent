$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$account = gh api user --jq .login
if ($LASTEXITCODE -ne 0 -or $account.Trim() -ne 'Cici0717') { throw 'Please authenticate as Cici0717 first.' }
$repo = 'Cici0717/second-look-recruiting-agent'
$existing = gh repo view $repo --json nameWithOwner 2>$null
if ($LASTEXITCODE -ne 0) {
  gh repo create $repo --public --description 'Second Look: evidence-based post-interview talent referral demo'
  if ($LASTEXITCODE -ne 0) { throw 'Repository creation failed.' }
}
$origin = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
  git remote add origin "https://github.com/$repo.git"
} elseif ($origin.Trim() -ne "https://github.com/$repo.git") {
  throw 'Existing origin differs; stopping to preserve repository configuration.'
}
git push -u origin main
if ($LASTEXITCODE -ne 0) { throw 'Push failed.' }
gh api "repos/$repo/pages" --silent 2>$null
if ($LASTEXITCODE -ne 0) {
  gh api --method POST "repos/$repo/pages" -f build_type=workflow
} else {
  gh api --method PUT "repos/$repo/pages" -f build_type=workflow
}
if ($LASTEXITCODE -ne 0) { throw 'Pages configuration failed.' }
gh workflow run pages.yml --repo $repo --ref main
if ($LASTEXITCODE -ne 0) { throw 'Deployment trigger failed.' }
Write-Host "Repository: https://github.com/$repo"
Write-Host 'Pages URL (available after Actions succeeds): https://cici0717.github.io/second-look-recruiting-agent/'
gh run list --repo $repo --workflow pages.yml --limit 2
