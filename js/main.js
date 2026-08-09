/* ============================================================
   Ferrari F80 · 交互脚本(原生 JS,无依赖)
   交互逻辑参照 tourbillon.hypercar.site
   ============================================================ */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------- Service Worker 注册 ---------- */
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.protocol === 'http:')) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }

  /* ---------- Hero 标题逐字入场 ---------- */
  var heroTitleEl = document.querySelector('.hero__title');
  if (heroTitleEl) {
    var text = heroTitleEl.textContent;
    var letters = text.split('').map(function (ch, i) {
      if (ch === ' ') return ' ';
      return '<span style="--d:' + (0.3 + i * 0.06).toFixed(2) + 's">' + ch + '</span>';
    }).join('');
    heroTitleEl.innerHTML = letters;
  }

  /* ---------- 工具 ---------- */
  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

  /* ---------- 自定义光标 ---------- */
  var cursorEl = document.querySelector('.cursor');
  if (cursorEl && finePointer && !prefersReduced) {
    var cx = -100, cy = -100, tx = -100, ty = -100, cursorRaf = null;
    document.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (cursorRaf === null) {
        cursorRaf = requestAnimationFrame(function loop() {
          cx = lerp(cx, tx, 0.28);
          cy = lerp(cy, ty, 0.28);
          cursorEl.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
          if (Math.abs(cx - tx) < 0.4 && Math.abs(cy - ty) < 0.4) {
            cx = tx; cy = ty;
            cursorRaf = null;
            return;
          }
          cursorRaf = requestAnimationFrame(loop);
        });
      }
    });
    document.addEventListener('mouseenter', function () { cursorEl.classList.add('is-on'); });
    document.addEventListener('mouseleave', function () { cursorEl.classList.remove('is-on'); });
    document.querySelectorAll('a, button, .hcard, .dcard, .gauge, .ptcard, .modecard, .gallery__item, .aero__hotspot, .webcard').forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursorEl.classList.add('is-hot'); });
      el.addEventListener('mouseleave', function () { cursorEl.classList.remove('is-hot'); });
    });
  }

  /* ---------- 章节数据 ---------- */
  var sections = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));
  var navSections = sections.filter(function (s) { return s.id !== 'hero'; });
  var isEN = (document.documentElement.lang || '').toLowerCase() === 'en';
  var sectionNames = isEN ? {
    story: 'Origin', design: 'Design', interior: 'Interior',
    powertrain: 'Powertrain', aero: 'Aerodynamics', architecture: 'Architecture',
    specs: 'Specifications', conclusion: 'Epilogue'
  } : {
    story: '缘起', design: '设计', interior: '内饰',
    powertrain: '动力总成', aero: '空气动力学', architecture: '底盘与动态',
    specs: '技术规格', conclusion: '总结'
  };

  /* ---------- 构建章节索引(右侧栏 + 全屏菜单) ---------- */
  var indexNav = document.getElementById('indexNav');
  var menuNav = document.querySelector('.menu-overlay__nav');
  var navNow = document.getElementById('navNow');
  var navItems = [];
  navSections.forEach(function (s, i) {
    var name = sectionNames[s.id] || s.id;
    var idx = String(i + 1).padStart(2, '0');
    if (indexNav) {
      var a = document.createElement('a');
      a.href = '#' + s.id;
      a.innerHTML = '<span class="idx">' + idx + '</span>' + name;
      indexNav.appendChild(a);
      navItems.push(a);
    }
    if (menuNav) {
      var m = document.createElement('a');
      m.href = '#' + s.id;
      m.innerHTML = '<span class="idx">' + idx + '</span>' + name;
      menuNav.appendChild(m);
    }
  });

  /* ---------- 章节高亮 + 当前章节提示 ---------- */
  var sectionIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        var id = en.target.id;
        navItems.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
        });
        document.querySelectorAll('.menu-overlay__nav a').forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
        });
        if (navNow) {
          var brand = document.querySelector('.nav__brand');
          var langWrap = document.querySelector('.nav__lang');
          if (id === 'hero') {
            navNow.style.opacity = '0';
            navNow.style.pointerEvents = 'none';
            if (brand) brand.classList.add('is-hidden');
            if (langWrap) langWrap.classList.add('is-hidden');
          } else {
            navNow.style.opacity = '1';
            navNow.style.pointerEvents = 'auto';
            if (brand) brand.classList.remove('is-hidden');
            if (langWrap) langWrap.classList.remove('is-hidden');
            var idx = navSections.indexOf(en.target) + 1;
            navNow.innerHTML = '<b>' + String(idx).padStart(2, '0') + '</b> · ' + (sectionNames[id] || id);
          }
        }
      }
    });
  }, { rootMargin: '-35% 0px -60% 0px' });
  sections.forEach(function (s) { sectionIO.observe(s); });

  /* ---------- 滚动:导航/进度表盘/索引/hero ---------- */
  var nav = document.getElementById('nav');
  var sg = document.querySelector('.scroll-gauge');
  var sgBar = sg ? sg.querySelector('.sg__bar') : null;
  var sgNum = sg ? sg.querySelector('.sg__num') : null;
  var SG_LEN = 119.4;
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll('.parallax'));

  /* 车身亮点(滚动驱动) */
  var hl = document.getElementById('carHighlights');
  var hlItems = hl ? Array.prototype.slice.call(hl.querySelectorAll('.carhighlights__item')) : [];
  var hlImgs = hl ? Array.prototype.slice.call(hl.querySelectorAll('.carhighlights__visual img')) : [];
  var hlBar = document.getElementById('hlBar');
  function updateHighlights() {
    if (!hl || !hlItems.length) return;
    var r = hl.getBoundingClientRect();
    var vh = window.innerHeight;
    var total = hl.offsetHeight - vh;
    var progress = total > 0 ? clamp((vh - r.top) / total, 0, 1) : 0;
    var idx = Math.min(hlItems.length - 1, Math.floor(progress * hlItems.length));
    hlItems.forEach(function (it, i) { it.classList.toggle('is-active', i === idx); });
    hlImgs.forEach(function (im, i) { im.classList.toggle('is-active', i === idx); });
    if (hlBar) hlBar.style.width = (progress * 100).toFixed(1) + '%';
  }

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var docH = document.documentElement.scrollHeight - window.innerHeight;
    var p = docH > 0 ? y / docH : 0;

    if (y > 40) nav.classList.add('is-solid'); else nav.classList.remove('is-solid');

    if (sg) {
      if (y > window.innerHeight * 0.7) sg.classList.add('is-on'); else sg.classList.remove('is-on');
      if (sgBar) sgBar.style.strokeDashoffset = String(SG_LEN * (1 - p));
      if (sgNum) sgNum.textContent = String(Math.round(p * 100)).padStart(2, '0');
    }

    var rail = document.querySelector('.index-rail');
    if (rail) {
      if (y > window.innerHeight * 0.9) rail.classList.add('is-on'); else rail.classList.remove('is-on');
      var railPct = document.getElementById('railPct');
      if (railPct) railPct.textContent = String(Math.round(p * 100)).padStart(2, '0') + '%';
      rail.style.setProperty('--rail-h', (p * 100).toFixed(1) + '%');
    }

    var navBar = document.getElementById('navBar');
    if (navBar) navBar.style.width = (p * 100).toFixed(1) + '%';

    /* hero 淡出 + 内容缩放 */
    var hero = document.querySelector('.hero');
    if (hero) {
      var hh = hero.offsetHeight;
      var fade = clamp(1 - y / (hh * 0.75), 0, 1);
      var v = hero.querySelector('.hero__video');
      if (v) v.style.opacity = String(fade);
      var hc = hero.querySelector('.hero__content');
      if (hc) hc.style.transform = 'translateY(' + (-y * 0.12).toFixed(1) + 'px) scale(' + (1 - y * 0.0006).toFixed(4) + ')';
    }

    /* 视差 */
    parallaxEls.forEach(function (el) {
      var speed = parseFloat(el.getAttribute('data-speed')) || 0.1;
      var r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      var off = (r.top + r.height / 2 - window.innerHeight / 2) * speed;
      el.style.transform = 'translate3d(0,' + (-off).toFixed(1) + 'px,0)';
    });

    /* 车身亮点 */
    updateHighlights();
  }
  var scrollTicking = false;
  window.addEventListener('scroll', function () {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(function () { onScroll(); scrollTicking = false; });
    }
  }, { passive: true });
  onScroll();

  /* 滚动进度表盘:点击回顶部 */
  if (sg) {
    sg.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  }

  /* ---------- 显现动画 ---------- */
  var revealIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add('is-in');
        revealIO.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(function (el) { revealIO.observe(el); });

  /* ---------- 成组卡片入场递增延迟(stagger,克制 0.08s 步进) ---------- */
  if (!prefersReduced) {
    var staggerGroups = [
      '.heritage__row', '.design__grid', '.pt__three', '.modes',
      '.webcards', '.aero__list', '.bigstats', '.accel', '.final-stats'
    ];
    staggerGroups.forEach(function (sel) {
      var group = document.querySelector(sel);
      if (!group) return;
      Array.prototype.forEach.call(group.children, function (child, i) {
        child.style.setProperty('--d', (i * 0.08).toFixed(2) + 's');
      });
    });
  }

  /* ---------- 章节分隔页入场 ---------- */
  var cbIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add('is-in');
        cbIO.unobserve(en.target);
      }
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('.chapter-break').forEach(function (el) { cbIO.observe(el); });

  /* ---------- 图片缩放揭示 ---------- */
  var zoomIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add('is-in');
        zoomIO.unobserve(en.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.zoom').forEach(function (el) { zoomIO.observe(el); });

  /* ---------- 数字计数 ---------- */
  function animateCount(el, to, decimals, dur) {
    var start = null;
    var d = decimals || 0;
    function step(ts) {
      if (!start) start = ts;
      var t = clamp((ts - start) / (dur || 1800), 0, 1);
      var v = to * easeOutExpo(t);
      el.textContent = d > 0 ? v.toFixed(d) : Math.round(v).toLocaleString('en-US');
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = d > 0 ? to.toFixed(d) : to.toLocaleString('en-US');
    }
    requestAnimationFrame(step);
  }
  var countIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      countIO.unobserve(el);
      animateCount(el, parseFloat(el.getAttribute('data-to')) || 0, parseFloat(el.getAttribute('data-decimals')) || 0);
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('.count').forEach(function (el) { countIO.observe(el); });

  /* ---------- 表盘 ---------- */
  var G_LEN = 527.8;
  var gaugeIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var g = en.target;
      gaugeIO.unobserve(g);
      var target = parseFloat(g.getAttribute('data-gauge')) || 0;
      var max = parseFloat(g.getAttribute('data-max')) || target;
      var bar = g.querySelector('.gauge__bar');
      var num = g.querySelector('figcaption b');
      var dur = 2200;
      var start = null;
      function step(ts) {
        if (!start) start = ts;
        var t = clamp((ts - start) / dur, 0, 1);
        var e = easeOutExpo(t);
        if (bar) bar.style.strokeDashoffset = String(G_LEN * (1 - (target / max) * e));
        if (num) num.textContent = Math.round(target * e).toLocaleString('en-US');
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.35 });
  document.querySelectorAll('.gauge').forEach(function (g) { gaugeIO.observe(g); });

  /* ---------- 倾斜卡片 ---------- */
  if (finePointer && !prefersReduced) {
    document.querySelectorAll('.tilt').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'perspective(700px) rotateY(' + (px * 7).toFixed(2) + 'deg) rotateX(' + (-py * 7).toFixed(2) + 'deg) translateY(-4px)';
      });
      card.addEventListener('mouseleave', function () { card.style.transform = ''; });
    });
  }

  /* ---------- 光斑 ---------- */
  var glow = document.querySelector('.glow');
  if (glow && finePointer && !prefersReduced) {
    var gx = -600, gy = -600, gtx = -600, gty = -600, glowRaf = null;
    document.addEventListener('mousemove', function (e) {
      gtx = e.clientX; gty = e.clientY;
      if (glowRaf === null) {
        glowRaf = requestAnimationFrame(function loop() {
          gx = lerp(gx, gtx, 0.12);
          gy = lerp(gy, gty, 0.12);
          glow.style.transform = 'translate3d(' + gx + 'px,' + gy + 'px,0)';
          glowRaf = requestAnimationFrame(loop);
        });
      }
    });
    document.addEventListener('mouseenter', function () { glow.classList.add('is-on'); });
    document.addEventListener('mouseleave', function () { glow.classList.remove('is-on'); });
  }

  /* ---------- 图片信息浮层(卡片标题注入) ---------- */
  document.querySelectorAll('.dcard, .gallery__item').forEach(function (card) {
    var h = card.querySelector('h3');
    if (h) card.setAttribute('data-cap', h.textContent.trim());
  });

  /* ---------- 菜单开关 ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var menuOverlay = document.getElementById('menuOverlay');
  var menuNavEl = document.querySelector('.menu-overlay__nav');
  function centerMenuOnActive() {
    if (!menuNavEl) return;
    var cur = document.querySelector('.index-rail__nav a.is-active');
    if (!cur) return;
    var name = cur.textContent.replace(/^\d+/, '').trim();
    menuNavEl.querySelectorAll('a').forEach(function (a) {
      if (a.textContent.replace(/^\d+/, '').trim() === name) {
        a.scrollIntoView({ block: 'center' });
      }
    });
  }
  if (menuBtn && menuOverlay) {
    menuBtn.addEventListener('click', function () {
      var open = menuOverlay.classList.contains('is-open');
      if (open) {
        menuOverlay.classList.remove('is-open');
        setTimeout(function () { menuOverlay.hidden = true; }, 400);
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.classList.remove('is-open');
        document.body.style.overflow = '';
      } else {
        menuOverlay.hidden = false;
        requestAnimationFrame(function () {
          menuOverlay.classList.add('is-open');
          centerMenuOnActive();
        });
        menuBtn.setAttribute('aria-expanded', 'true');
        menuBtn.classList.add('is-open');
        document.body.style.overflow = 'hidden';
      }
    });
    menuOverlay.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        menuOverlay.classList.remove('is-open');
        setTimeout(function () { menuOverlay.hidden = true; }, 400);
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.classList.remove('is-open');
        document.body.style.overflow = '';
      }
    });
  }

  /* ---------- 点击波纹 ---------- */
  document.addEventListener('click', function (e) {
    var r = document.createElement('span');
    r.className = 'ripple';
    r.style.left = e.clientX + 'px';
    r.style.top = e.clientY + 'px';
    document.body.appendChild(r);
    setTimeout(function () { r.remove(); }, 750);
  });

  /* ---------- 设计卡片鼠标高光跟随 ---------- */
  if (finePointer && !prefersReduced) {
    document.querySelectorAll('.dcard').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width * 100).toFixed(1) + '%');
        card.style.setProperty('--my', ((e.clientY - rect.top) / rect.height * 100).toFixed(1) + '%');
      });
    });
    /* 通用卡片光边跟随 */
    document.querySelectorAll('.hcard, .ptcard, .modecard, .webcard').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width * 100).toFixed(1) + '%');
        card.style.setProperty('--my', ((e.clientY - rect.top) / rect.height * 100).toFixed(1) + '%');
      });
    });
  }

  /* ---------- 导航跳转(平滑滚动;菜单打开时先关闭并解锁滚动) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href').slice(1);
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop);
      var fromMenu = menuOverlay && menuOverlay.classList.contains('is-open');
      if (fromMenu) {
        menuOverlay.classList.remove('is-open');
        setTimeout(function () { menuOverlay.hidden = true; }, 400);
        if (menuBtn) { menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.classList.remove('is-open'); }
      }
      document.body.style.overflow = '';
      var go = function () {
        window.scrollTo({ top: top, behavior: prefersReduced ? 'auto' : 'smooth' });
      };
      if (fromMenu) { setTimeout(go, 360); } else { go(); }
    });
  });

  /* ---------- 卡片点击:防滚动防御 + 亮度脉冲 ---------- */
  var tapTargets = '.hcard, .dcard, .ptcard, .modecard, .webcard, .accel__item, .gallery__item, .aero__panel-item';
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest(tapTargets) : null;
    if (!el) return;
    if (e.target.closest('a') || e.target.tagName === 'VIDEO' || e.target.closest('video')) return;
    e.preventDefault();
    el.classList.remove('is-tapped');
    void el.offsetWidth;
    el.classList.add('is-tapped');
    el.addEventListener('animationend', function h() {
      el.classList.remove('is-tapped');
      el.removeEventListener('animationend', h);
    }, { once: true });
  });

  /* ---------- 背景视频区:入场 + 视口播放 ---------- */
  var vsIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var sec = en.target;
      var v = sec.querySelector('.vsection__video');
      if (en.isIntersecting) {
        sec.classList.add('is-in');
        if (v && v.tagName === 'VIDEO') {
          var p = v.play();
          if (p && p.catch) p.catch(function () {});
        }
      } else {
        if (v && v.tagName === 'VIDEO') v.pause();
      }
    });
  }, { threshold: 0.18 });
  document.querySelectorAll('.vsection').forEach(function (el) { vsIO.observe(el); });

  /* ---------- 视频卡:进入视口播放 ---------- */
  var wcIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var v = en.target.querySelector('.webcard__video');
      if (!v) return;
      if (en.isIntersecting) {
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
      } else {
        v.pause();
      }
    });
  }, { threshold: 0.2 });
  document.querySelectorAll('.webcard').forEach(function (el) { wcIO.observe(el); });

  /* ---------- media-row 内视频:进入视口播放 ---------- */
  var mrIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var v = en.target.querySelector('video');
      if (!v) return;
      if (en.isIntersecting) {
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
      } else {
        v.pause();
      }
    });
  }, { threshold: 0.25 });
  document.querySelectorAll('.media-row__img').forEach(function (el) {
    if (el.querySelector('video')) mrIO.observe(el);
  });

  /* ---------- 空动热点 ---------- */
  var aeroStage = document.getElementById('aeroStage');
  if (aeroStage) {
    var aeroMedias = Array.prototype.slice.call(aeroStage.querySelectorAll('.aero__media'));
    var aeroPanelItems = Array.prototype.slice.call(aeroStage.querySelectorAll('.aero__panel-item'));
    aeroStage.querySelectorAll('.aero__hotspot').forEach(function (btn) {
      /* hover 预加载对应视频,点击即播 */
      btn.addEventListener('mouseenter', function () {
        var m = aeroStage.querySelector('.aero__media[data-aero="' + btn.getAttribute('data-aero') + '"]');
        var v = m ? m.querySelector('video') : null;
        if (v && v.readyState < 2) {
          v.preload = 'auto';
          v.load();
        }
      });
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-aero');
        aeroStage.querySelectorAll('.aero__hotspot').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });
        aeroMedias.forEach(function (m) {
          m.classList.toggle('is-active', m.getAttribute('data-aero') === key);
          var v = m.querySelector('video');
          if (v) {
            if (m.getAttribute('data-aero') === key) {
              var p = v.play();
              if (p && p.catch) p.catch(function () {});
            } else {
              v.pause();
              v.currentTime = 0;
            }
          }
        });
        aeroPanelItems.forEach(function (it) {
          it.classList.toggle('is-active', it.getAttribute('data-aero') === key);
        });
      });
    });
    /* 视频失败兜底:显示 fallback 图 */
    aeroStage.querySelectorAll('.aero__media video').forEach(function (v) {
      v.addEventListener('error', function () {
        var fb = v.parentNode.querySelector('.aero__media-fallback');
        if (fb) fb.hidden = false;
      });
    });
  }

  /* ---------- 图库 ---------- */
  var gallery = document.getElementById('galleryGrid');
  var GALLERY_IMGS = [
    '6710c04c6eba150012b0f0cc', '6710c04eefdcb00010e2ff66', '6710c0526eba150012b0f0cd',
    '6710c05475bf820011da7778', '6710c05befdcb00010e2ff67', '6710c05ebd9b53001088099d',
    '6710c06175d163001163a33f', '6710c063efdcb00010e2ff68', '6710c24a75bf820011da777b',
    '6710c26475d163001163a342', '6710c279b2fa0c0011ce56d9', '6710c27ebd9b5300108809a0',
    '6710c3e18d832e0011038c4b', '6710c3e3bd9b5300108809a1', '6710c3e5b2fa0c0011ce56da',
    '6710c3e7efdcb00010e2ff6a', '6710c3e96eba150012b0f0ce', '6710f0dc75d163001163a361',
    '6710f0df8d832e0011038c6c'
  ];
  var lightbox = document.getElementById('lightbox');
  var lbImg = document.getElementById('lbImg');
  var lbCap = document.getElementById('lbCap');
  var lbIndex = 0;

  function renderLightbox() {
    var id = GALLERY_IMGS[lbIndex];
    if (!id) return;
    lbImg.src = 'assets/img/' + id + '.webp';
    lbImg.alt = 'Ferrari F80';
    lbCap.textContent = 'FERRARI F80 · ' + String(lbIndex + 1).padStart(2, '0') + ' / ' + String(GALLERY_IMGS.length).padStart(2, '0');
  }
  function openLightbox(idx) {
    lbIndex = idx;
    renderLightbox();
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (gallery) {
    GALLERY_IMGS.forEach(function (id, i) {
      var btn = document.createElement('button');
      btn.className = 'gallery__item';
      btn.setAttribute('aria-label', 'Ferrari F80');
      var img = document.createElement('img');
      img.src = 'assets/img/' + id + '.webp';
      img.alt = 'Ferrari F80';
      img.loading = 'lazy';
      img.width = 1600; img.height = 1200;
      btn.appendChild(img);
      var cap = document.createElement('i');
      cap.textContent = 'FERRARI F80 · ' + String(i + 1).padStart(2, '0');
      btn.appendChild(cap);
      btn.addEventListener('click', function () { openLightbox(i); });
      gallery.appendChild(btn);
    });
  }
  if (lightbox) {
    document.querySelector('[data-lb-close]').addEventListener('click', closeLightbox);
    document.querySelector('[data-lb-prev]').addEventListener('click', function () {
      lbIndex = (lbIndex - 1 + GALLERY_IMGS.length) % GALLERY_IMGS.length;
      renderLightbox();
    });
    document.querySelector('[data-lb-next]').addEventListener('click', function () {
      lbIndex = (lbIndex + 1) % GALLERY_IMGS.length;
      renderLightbox();
    });
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
  }

  /* ---------- 键盘 ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (lightbox && lightbox.classList.contains('is-open')) closeLightbox();
      if (menuOverlay && menuOverlay.classList.contains('is-open')) {
        menuOverlay.classList.remove('is-open');
        setTimeout(function () { menuOverlay.hidden = true; }, 400);
        if (menuBtn) { menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.classList.remove('is-open'); }
        document.body.style.overflow = '';
      }
    }
    if (lightbox && lightbox.classList.contains('is-open')) {
      if (e.key === 'ArrowLeft') document.querySelector('[data-lb-prev]').click();
      if (e.key === 'ArrowRight') document.querySelector('[data-lb-next]').click();
    }
  });

  /* ---------- 图片懒加载兜底(不修改 HTML 源码,运行时补齐) ---------- */
  document.querySelectorAll('img').forEach(function (img) {
    if (!img.closest('.hero') && !img.hasAttribute('loading')) {
      img.setAttribute('loading', 'lazy');
    }
    if (!img.hasAttribute('decoding')) {
      img.setAttribute('decoding', 'async');
    }
  });
})();

