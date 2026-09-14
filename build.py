#!/usr/bin/env python3
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import md2html

HERE = os.path.dirname(os.path.abspath(__file__))
UNILAND_SRC = os.path.join(HERE, os.pardir, 'src', 'uniland')
BUILD_STAMP = os.environ.get('BUILD_STAMP') or str(int(max(
    [os.path.getmtime(os.path.join(HERE, f)) for f in ('app.js', 'data.js')] +
    [os.path.getmtime(os.path.join(HERE, 'assets', f)) for f in os.listdir(os.path.join(HERE, 'assets'))])))

HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charSet="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>{title}</title>
<meta name="description" content="{desc}"/>
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml"/>
<link rel="stylesheet" href="assets/jetbrains-mono.css?v={v}"/>
<link rel="stylesheet" href="assets/fontawesome-subset.css?v={v}"/>
<link rel="stylesheet" href="assets/style.css?v={v}"/>
<link rel="stylesheet" href="assets/docs.css?v={v}"/>
<link rel="stylesheet" href="assets/fx.css?v={v}"/>
</head>
<body>
"""

SIDENAV = """<div class="SideNav-module__W2m5EW__overlay" id="sideOverlay" aria-hidden="true"></div>
<aside class="SideNav-module__W2m5EW__sideNav" id="sideNav">
<nav class="SideNav-module__W2m5EW__navList" id="sideNavList"></nav>
</aside>
"""

TOPBAR = """<div class="TopBar-module__hfKmSa__topBar">
<div class="TopBar-module__hfKmSa__leftSlot">
<div class="TopBar-module__hfKmSa__settingsBtnWrap">
<button class="TopBar-module__hfKmSa__settingsBtn" id="navBtn" aria-label="Open navigation"><i class="fas fa-bars"></i></button>
<span class="TopBar-module__hfKmSa__tooltip TopBar-module__hfKmSa__tooltipRight" data-i18n="navigation">Navigation</span>
</div>
</div>
<nav class="TopBar-module__hfKmSa__breadcrumb" aria-label="breadcrumb">
{crumb}
</nav>
<div class="TopBar-module__hfKmSa__rightControls">
<div class="TopBar-module__hfKmSa__settingsBtnWrap">
<button class="TopBar-module__hfKmSa__settingsBtn" id="settingsBtn" aria-label="Settings"><i class="fas fa-cog"></i></button>
<span class="TopBar-module__hfKmSa__tooltip" id="settingsTooltip" data-i18n="preferences">Preferences</span>
</div>
<div class="TopBar-module__hfKmSa__popup" id="settingsPopup">
<div class="TopBar-module__hfKmSa__popupSection">
<div class="TopBar-module__hfKmSa__popupTitle" data-i18n="theme">Theme</div>
<div class="TopBar-module__hfKmSa__optionRow">
<button class="TopBar-module__hfKmSa__optionBtn js-theme-btn" data-theme="auto">Auto</button>
<button class="TopBar-module__hfKmSa__optionBtn js-theme-btn" data-theme="light" aria-label="Light"><i class="fas fa-sun"></i></button>
<button class="TopBar-module__hfKmSa__optionBtn js-theme-btn" data-theme="dark" aria-label="Dark"><i class="fas fa-moon"></i></button>
</div>
</div>
<div class="TopBar-module__hfKmSa__popupSection">
<div class="TopBar-module__hfKmSa__popupTitle" data-i18n="language">Language</div>
<div class="TopBar-module__hfKmSa__optionRow">
<button class="TopBar-module__hfKmSa__optionBtn js-lang-btn" data-lang="en">EN</button>
<button class="TopBar-module__hfKmSa__optionBtn js-lang-btn" data-lang="ru">RU</button>
</div>
</div>
<div class="TopBar-module__hfKmSa__popupSection">
<div class="TopBar-module__hfKmSa__popupTitle" data-i18n="effects">Effects</div>
<div class="TopBar-module__hfKmSa__optionRow">
<div class="TopBar-module__hfKmSa__settingsBtnWrap">
<button class="TopBar-module__hfKmSa__optionBtn" id="particlesBtn" type="button" aria-label="Click particles"><i class="fas fa-wand-magic-sparkles"></i></button>
<span class="TopBar-module__hfKmSa__tooltip" data-i18n="particles">Click particles</span>
</div>
</div>
</div>
</div>
</div>
</div>
"""

FOOTER_HOME = """<footer class="page-module__E0kJGG__footer">
<p id="animated-text"><span data-i18n="endOfPage">End of page</span><span aria-hidden="true" style="display:inline-flex"><span class="animated-dot" style="animation-delay:0s">.</span><span class="animated-dot" style="animation-delay:0.2s">.</span><span class="animated-dot" style="animation-delay:0.4s">.</span></span></p>
</footer>
</div>
"""

FOOTER_SUB = """<footer class="page-module__iRtBbG__footer">
<p id="animated-text"><span data-i18n="endOfPage">End of page</span><span aria-hidden="true" style="display:inline-flex"><span class="animated-dot" style="animation-delay:0s">.</span><span class="animated-dot" style="animation-delay:0.2s">.</span><span class="animated-dot" style="animation-delay:0.4s">.</span></span></p>
</footer>
</div>
"""

SCRIPTS = """<script src="data.js?v={v}"></script>
<script src="app.js?v={v}"></script>
<script src="assets/fx.js?v={v}"></script>
</body>
</html>
"""

HOME_CRUMB = ('<span class="TopBar-module__hfKmSa__breadcrumbItem">'
              '<span class="TopBar-module__hfKmSa__breadcrumbCurrent" data-i18n="navHomeLabel">Home</span></span>')


def crumb_sub(i18n_key, fallback):
    return ('<span class="TopBar-module__hfKmSa__breadcrumbItem TopBar-module__hfKmSa__breadcrumbItemHidden">'
            '<a class="TopBar-module__hfKmSa__breadcrumbPrev" href="index.html" data-i18n="navHomeLabel">Home</a></span>'
            '<span class="TopBar-module__hfKmSa__breadcrumbItem">'
            '<span class="TopBar-module__hfKmSa__breadcrumbSep">/</span>'
            '<span class="TopBar-module__hfKmSa__breadcrumbCurrent" data-i18n="%s">%s</span></span>' % (i18n_key, fallback))


def hero():
    return """<main class="page-module__E0kJGG__main">
<div class="page-module__E0kJGG__introCol">
<h1 id="heroHandle" class="jelly-drop">cho</h1>
<p class="page-module__E0kJGG__tagline jelly-rise" id="heroTagline"></p>
</div>
<div class="page-module__E0kJGG__heroDivider" aria-hidden="true"></div>
<div class="page-module__E0kJGG__links">
<div class="GithubCard-module__CP3e5W__card">
<a href="https://github.com/name-cho" class="GithubCard-module__CP3e5W__mainRow" id="gitCard" aria-label="GitHub profile" target="_blank" rel="noopener">
<div class="GithubCard-module__CP3e5W__avatar GithubCard-module__CP3e5W__skeleton" id="gitAvatar"></div>
<div class="GithubCard-module__CP3e5W__info">
<div class="GithubCard-module__CP3e5W__login GithubCard-module__CP3e5W__skeletonText" id="gitLogin"></div>
<div class="GithubCard-module__CP3e5W__bio GithubCard-module__CP3e5W__skeletonText" id="gitBio"></div>
</div>
<div class="GithubCard-module__CP3e5W__stats">
<div class="GithubCard-module__CP3e5W__stat"><i class="fas fa-star"></i><span class="GithubCard-module__CP3e5W__skeletonText"></span></div>
<div class="GithubCard-module__CP3e5W__stat"><i class="fas fa-code-branch"></i><span class="GithubCard-module__CP3e5W__skeletonText"></span></div>
</div>
</a>
<div class="GithubCard-module__CP3e5W__topRepo" id="gitTopRepo"></div>
</div>
<div>
<div class="TelegramCard-module__SQS1Ya__card">
<div class="TelegramCard-module__SQS1Ya__mainRow">
<div class="TelegramCard-module__SQS1Ya__info">
<div class="TelegramCard-module__SQS1Ya__name" id="tgName">t.me/zoyuki_room</div>
<div class="TelegramCard-module__SQS1Ya__description" id="tgDesc"></div>
<div class="TelegramCard-module__SQS1Ya__usernames" id="tgUsernames"></div>
</div>
<div class="TelegramCard-module__SQS1Ya__idBadge"><span class="TelegramCard-module__SQS1Ya__idLabel" id="tgBadgeLabel">TG</span><span class="TelegramCard-module__SQS1Ya__idValue" id="tgBadgeValue">channel</span></div>
</div>
</div>
<a class="page-module__E0kJGG__moreSocials" id="moreSocials" href="socials.html"></a>
</div>
</div>
</main>
"""


PROJECTS_SECTION = """<section class="ProjectsSection-module__2qoIza__section">
<div class="ProjectsSection-module__2qoIza__header jelly-rise">
<h2 data-i18n="myProjects">My projects</h2>
<div class="ProjectsSection-module__2qoIza__sortRoot" id="sortRoot"></div>
</div>
<div class="ProjectsSection-module__2qoIza__grid" id="projectsGrid">
<div class="ProjectsSection-module__2qoIza__card ProjectsSection-module__2qoIza__cardFeatured">
<div class="ProjectsSection-module__2qoIza__featuredBadge ProjectsSection-module__2qoIza__skeletonText"></div>
<div class="ProjectsSection-module__2qoIza__name ProjectsSection-module__2qoIza__skeletonText"></div>
<div class="ProjectsSection-module__2qoIza__description ProjectsSection-module__2qoIza__skeletonText"></div>
<div class="ProjectsSection-module__2qoIza__meta"><span class="ProjectsSection-module__2qoIza__metaItem ProjectsSection-module__2qoIza__skeletonText"></span><span class="ProjectsSection-module__2qoIza__metaItem ProjectsSection-module__2qoIza__skeletonText"></span></div>
</div>
<div class="ProjectsSection-module__2qoIza__divider" aria-hidden="true"></div>
<div class="ProjectsSection-module__2qoIza__stack">
<div class="ProjectsSection-module__2qoIza__card">
<div class="ProjectsSection-module__2qoIza__name ProjectsSection-module__2qoIza__skeletonText"></div>
<div class="ProjectsSection-module__2qoIza__description ProjectsSection-module__2qoIza__skeletonText"></div>
<div class="ProjectsSection-module__2qoIza__meta"><span class="ProjectsSection-module__2qoIza__metaItem ProjectsSection-module__2qoIza__skeletonText"></span><span class="ProjectsSection-module__2qoIza__metaItem ProjectsSection-module__2qoIza__skeletonText"></span></div>
</div>
<div class="ProjectsSection-module__2qoIza__card">
<div class="ProjectsSection-module__2qoIza__name ProjectsSection-module__2qoIza__skeletonText"></div>
<div class="ProjectsSection-module__2qoIza__description ProjectsSection-module__2qoIza__skeletonText"></div>
<div class="ProjectsSection-module__2qoIza__meta"><span class="ProjectsSection-module__2qoIza__metaItem ProjectsSection-module__2qoIza__skeletonText"></span><span class="ProjectsSection-module__2qoIza__metaItem ProjectsSection-module__2qoIza__skeletonText"></span></div>
</div>
</div>
</div>
<div class="page-module__E0kJGG__viewMoreWrap" id="viewMoreWrap"></div>
<p class="page-module__E0kJGG__note" id="snapshotNote"></p>
</section>
"""


def page(fname, title, desc, crumb, body, footer=FOOTER_HOME, container='page-module__E0kJGG__container', page_id=''):
    attrs = ' class="%s"' % container + (' data-page="%s"' % page_id if page_id else '')
    html = (HEAD.format(title=title, desc=desc, v=BUILD_STAMP) + SIDENAV + TOPBAR.format(crumb=crumb) +
            '<div%s>' % attrs + body + footer + SCRIPTS.format(v=BUILD_STAMP))
    open(os.path.join(HERE, fname), 'w', encoding='utf-8').write(html)
    print('wrote %-22s %7d bytes' % (fname, len(html)))


page('index.html', '@name-cho',
     'cho — projects, documentation and links.',
     HOME_CRUMB, hero() + PROJECTS_SECTION)

about_body = """<main class="page-module__E0kJGG__main">
<div class="page-module__E0kJGG__introCol">
<h1 class="jelly-drop" data-i18n="aboutTitle">About</h1>
<p class="page-module__E0kJGG__tagline jelly-rise" data-i18n="aboutTagline"></p>
</div>
<div class="page-module__E0kJGG__heroDivider" aria-hidden="true"></div>
<div class="page-module__E0kJGG__prose jelly-rise">
<h2 data-i18n="aboutH1"></h2>
<p data-i18n="aboutP1"></p>
<h2 data-i18n="aboutH2"></h2>
<p data-i18n="aboutP2"></p>
<h2 data-i18n="aboutH3"></h2>
<p data-i18n="aboutP3"></p>
<p class="muted" data-i18n="aboutP4"></p>
</div>
</main>
"""
page('about.html', 'about · cho', 'the person behind these pages.',
     crumb_sub('aboutTitle', 'About'), about_body)

socials_body = """<main class="page-module__E0kJGG__main">
<div class="page-module__E0kJGG__introCol">
<h1 class="jelly-drop" data-i18n="socialsTitle">Socials</h1>
<p class="page-module__E0kJGG__tagline jelly-rise" data-i18n="socialsTagline"></p>
</div>
<div class="page-module__E0kJGG__heroDivider" aria-hidden="true"></div>
<div class="page-module__E0kJGG__listCard jelly-rise" id="socialsList"></div>
<p class="page-module__E0kJGG__note" id="socialsNote"></p>
</main>
"""
page('socials.html', 'socials · cho', 'where to find cho.',
     crumb_sub('socialsTitle', 'Socials'), socials_body)

uniland_overview = """<div class="page-module__bkK2cG__container">
<main class="page-module__bkK2cG__main">
<h1 class="jelly-drop">UniLand</h1>
<p class="page-module__bkK2cG__description jelly-rise" data-i18n="unilandDesc"></p>
<div class="page-module__bkK2cG__buttons jelly-rise">
<a href="https://github.com/name-cho/uniland" class="page-module__bkK2cG__button" target="_blank" rel="noopener"><i class="fas fa-code-commit"></i><span data-i18n="btnRepo">Repository</span></a>
<a href="uniland-doc.html" class="page-module__bkK2cG__button"><i class="fas fa-book"></i><span data-i18n="btnDocs">Documentation</span></a>
<a href="uniland-examples.html" class="page-module__bkK2cG__button"><i class="fas fa-flask"></i><span data-i18n="btnExamples">Examples</span></a>
</div>
</main>
"""
page('uniland.html', 'uniland · cho', 'a small friendly language for scripts.',
     crumb_sub('unilandOverview', 'Overview'), uniland_overview,
     footer=FOOTER_SUB, page_id='uniland')

md = open(os.path.join(UNILAND_SRC, 'README.md'), encoding='utf-8').read()
md = md.replace('https://github.com/zoyuki/', 'https://github.com/name-cho/')
body, toc = md2html.convert(md)
body = body.replace('<h1 id="uniland">UniLand</h1>', '<h1 id="uniland" class="jelly-drop">UniLand</h1>')

docs_body = """<div class="page-module__iRtBbG__container" data-page="docs">
<main class="page-module__iRtBbG__main">
<div class="page-module__iRtBbG__body jelly-rise" id="docsBody">
<p class="page-module__iRtBbG__intro">__INTRO__</p>
__BODY__
</div>
<div class="page-module__iRtBbG__toc" id="docsToc">__TOC__</div>
</main>
"""
intro = ('Полная документация языка из README репозитория. Разделы и номера совпадают с оглавлением справа; '
         'у каждого блока кода есть кнопка Copy.')
docs_body = (docs_body
             .replace('__INTRO__', intro)
             .replace('__BODY__', body)
             .replace('__TOC__', md2html.toc_html(toc, 'Содержание')))
page('uniland-doc.html', 'uniland / docs', 'UniLand language documentation.',
     crumb_sub('unilandDocs', 'Documentation'), docs_body,
     footer=FOOTER_SUB, page_id='docs')

EXAMPLES = [
    ('hello.uni', 'Первая программа', 'Одна строка — точка входа в язык.'),
    ('greet_cli.uni', 'CLI с аргументами', 'Чтение аргументов командной строки и шаблонные строки.'),
    ('wordcount.uni', 'Подсчёт слов', 'Файлы, строки, массивы и функции в одном маленьком скрипте.'),
    ('ticker.uni', 'Тикер', 'Долгоживущий скрипт: цикл, пауза, обновление вывода.'),
    ('gui_demo.uni', 'Оконная программа', 'GUI на tkinter прямо из UniLand.'),
    ('media_demo.uni', 'Картинки и видео', 'Загрузка изображений, GIF и видео в окне.'),
    ('selftest.uni', 'Самопроверка языка', 'Набор проверок: синтаксис, встроенные функции, ошибки.'),
]
ex_cards = []
for fname, title, note in EXAMPLES:
    p = os.path.join(UNILAND_SRC, fname)
    if not os.path.exists(p):
        continue
    code = open(p, encoding='utf-8').read().rstrip('\n')
    block = md2html.raw_code_block(code, 'uniland')
    block = block.replace(
        '<span class="page-module__iRtBbG__codeLang">uniland</span>',
        '<span class="page-module__iRtBbG__codeLang">%s</span>'
        '<span class="page-module__iRtBbG__exampleNote">%s</span>'
        % (md2html.esc(fname), md2html.esc(title + ' — ' + note)), 1)
    block = block.replace('class="page-module__iRtBbG__codeBlock"',
                          'class="page-module__iRtBbG__codeBlock exampleBlock" id="%s"'
                          % md2html.slugify(fname), 1)
    ex_cards.append(block)

examples_body = """<div class="page-module__iRtBbG__container" data-page="examples">
<main class="page-module__iRtBbG__main">
<div class="page-module__iRtBbG__body">
<h1 class="jelly-drop">Примеры</h1>
<p class="page-module__iRtBbG__intro">Файлы из папки <code>examples/</code> репозитория UniLand — от «привет, мир»
до оконных программ и видео. Запуск: <code>uniland run file.uni</code>.</p>
__CARDS__
</div>
<div class="page-module__iRtBbG__toc" id="examplesToc">__TOC__</div>
</main>
"""
ex_toc = [{'level': 2, 'text': t, 'id': md2html.slugify(f), 'num': str(i + 1)}
          for i, (f, t, _) in enumerate(EXAMPLES) if os.path.exists(os.path.join(UNILAND_SRC, f))]
examples_body = (examples_body
                 .replace('__CARDS__', '\n'.join(ex_cards))
                 .replace('__TOC__', md2html.toc_html(ex_toc, 'Файлы')))
page('uniland-examples.html', 'uniland / examples', 'UniLand example scripts.',
     crumb_sub('unilandExamples', 'Examples'), examples_body,
     footer=FOOTER_SUB, page_id='examples')
