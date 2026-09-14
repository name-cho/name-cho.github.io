#!/usr/bin/env python3
import json
import re
import sys
import urllib.request

DATA_JS = sys.argv[1] if len(sys.argv) > 1 else 'data.js'
GH_USER = 'name-cho'

def get(url):
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/vnd.github+json'})
    return urllib.request.urlopen(req, timeout=40)

def human_size(kib):
    n = kib * 1024
    if n < 1024:
        return '%d B' % n
    if n < 1024 * 1024:
        return '%.2f KB' % (n / 1024)
    if n < 1024 * 1024 * 1024:
        return '%.2f MiB' % (n / 1024 / 1024)
    return '%.2f GiB' % (n / 1024 / 1024 / 1024)

def commit_count(full_name):
    try:
        r = get('https://api.github.com/repos/%s/commits?per_page=1' % full_name)
        link = r.headers.get('Link', '')
        m = re.search(r'[?&]page=(\d+)>; rel="last"', link)
        if m:
            return int(m.group(1))
        return len(json.load(r))
    except Exception:
        return None

def main():
    src = open(DATA_JS, encoding='utf-8').read()
    names = re.findall(r'name: "([^"]+)",\n      icon:', src)
    repos = json.load(get('https://api.github.com/users/%s/repos?per_page=100' % GH_USER))
    by_name = {r['name'].lower(): r for r in repos}
    print('projects: %d | github repos: %d' % (len(names), len(repos)))

    totals = {'stars': 0, 'forks': 0}
    changed = 0
    for r in repos:
        totals['stars'] += r['stargazers_count']
        totals['forks'] += r['forks_count']

    for name in names:
        r = by_name.get(name.lower())
        if not r:
            continue
        cc = commit_count(r['full_name'])
        fields = {
            'stars': r['stargazers_count'],
            'forks': r['forks_count'],
            'size': human_size(r['size']),
            'updated': (r.get('pushed_at') or r.get('updated_at') or '')[:20] + 'Z',
        }
        if cc is not None:
            fields['commits'] = cc

        marker = 'name: "%s",' % name
        at = src.find(marker)
        if at < 0:
            continue
        end = src.find('\n    },', at)
        block = src[at:end]
        new = block
        for key, val in fields.items():
            if key in ('stars', 'forks', 'commits'):
                new = re.sub(r'(%s: )\d+' % key, r'\g<1>%d' % val, new, count=1)
            else:
                new = re.sub(r'(%s: ")[^"]*' % key, lambda m: m.group(1) + val, new, count=1)
        if new != block:
            src = src[:at] + new + src[end:]
            changed += 1
            print('  ~ %s: %s' % (name, fields))

    m = re.search(r'(stats: \{ stars: )\d+(, forks: )\d+(, repos: )\d+', src)
    if m:
        rep = m.group(1) + str(totals['stars']) + m.group(2) + str(totals['forks']) + m.group(3) + str(len(repos))
        src = src[:m.start()] + rep + src[m.end():]
        print('  ~ git card totals: %s' % totals)

    top = max(repos, key=lambda r: r['stargazers_count'])
    m = re.search(r'topRepo: \{ name: "[^"]*", lang: "[^"]*", stars: \d+, url: "[^"]*" \}', src)
    if m:
        src = src[:m.start()] + ('topRepo: { name: "%s", lang: "%s", stars: %d, url: "%s" }' % (
            top['name'], top.get('language') or '—', top['stargazers_count'], top['html_url'])) + src[m.end():]

    open(DATA_JS, 'w', encoding='utf-8').write(src)
    print('updated projects: %d' % changed)
    return 0

if __name__ == '__main__':
    sys.exit(main())
