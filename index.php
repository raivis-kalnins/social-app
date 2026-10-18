<?php
declare(strict_types=1);
require __DIR__.'/includes/core.php';
boot();
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#111c2e">
  <meta name="description" content="Social 63 — a private social media workspace for content planning, reviews, inbox, video analytics and channel management.">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>Social 63 — Social Media Workspace</title>
  <link rel="icon" type="image/svg+xml" href="assets/icon.svg">
  <link rel="manifest" href="manifest.webmanifest">
  <link rel="stylesheet" href="assets/app.css?v=1.1.0">
  <script src="assets/app.js?v=1.1.0" defer></script>
</head>
<body>
  <div id="loading" class="loading-screen" role="status"><span class="spinner"></span><b>Social <em>63</em></b><p>Opening your workspace…</p></div>
  <main id="loginView" class="login-page" hidden>
    <div class="login-visual">
      <div class="login-art" aria-hidden="true"><span class="art-orbit orbit-1"></span><span class="art-orbit orbit-2"></span><span class="art-core">63</span><span class="art-mini art-mini-one">♥ 4.8%</span><span class="art-mini art-mini-two">↗ +18%</span><span class="art-mini art-mini-three">▶ 125.4K</span></div>
      <div class="login-visual-text"><span class="eyebrow light">YOUR SOCIAL COMMAND CENTRE</span><h2>Everything social.<br><span>One beautiful space.</span></h2><p>Plan content, organise conversations and turn social data into decisions.</p><div class="login-features"><span>Content planner</span><span>Video analytics</span><span>Reviews & inbox</span></div>
        <div class="login-promo"><span class="login-promo-tag">DEVELOPED BY DIGITALPULSE</span><strong>Need your own custom app or website?</strong><p>Modern web applications, custom WordPress plugins and smarter eCommerce solutions.</p><a class="login-promo-cta" href="https://digitalpulse.click/" target="_blank" rel="noopener noreferrer">Explore DigitalPulse <span aria-hidden="true">↗</span></a></div>
        <div class="login-apps"><span class="login-apps-caption">DISCOVER MORE FROM THE 63 APP FAMILY</span><div class="login-app-links"><a href="https://games.63.lv/" target="_blank" rel="noopener noreferrer">🎮 Games</a><a href="https://translate.63.lv/" target="_blank" rel="noopener noreferrer">🌐 Translate</a><a href="https://radio.63.lv/" target="_blank" rel="noopener noreferrer">♫ Radio</a><a href="https://whiteboard.63.lv/" target="_blank" rel="noopener noreferrer">✎ Whiteboard</a><a href="https://music-writer.63.lv/" target="_blank" rel="noopener noreferrer">♬ Music Writer</a><a href="https://price.63.lv/" target="_blank" rel="noopener noreferrer">↗ Price</a></div></div>
      </div>
    </div>
    <div class="login-panel"><div class="login-box"><a class="login-brand" href="https://social.63.lv/"><img src="assets/icon.svg" alt="" width="41" height="41"><span>Social <strong>63</strong></span></a><span class="eyebrow">WELCOME BACK</span><h1>Sign in to Social 63</h1><p class="muted">Your content, channels and insights in one workspace.</p>
      <form id="loginForm" autocomplete="on"><label for="loginEmail">Email address</label><div class="field-wrap"><span class="field-icon" aria-hidden="true">✉</span><input type="email" name="email" id="loginEmail" autocomplete="username" placeholder="you@example.com" required></div><label for="loginPassword">Password</label><div class="field-wrap"><span class="field-icon" aria-hidden="true">⌑</span><input type="password" name="password" id="loginPassword" autocomplete="current-password" placeholder="Enter your password" required minlength="8"><button class="password-toggle" id="togglePassword" type="button" aria-label="Show password">Show</button></div><div id="loginCaptcha" class="login-captcha" hidden><div id="hcaptchaMount"></div><p class="captcha-message" id="captchaStatus" role="status">Loading verification…</p></div><div id="loginError" class="form-error" role="alert" hidden></div><button type="submit" class="btn btn-primary login-submit" id="loginButton">Sign in <span aria-hidden="true">→</span></button></form>
      <p class="login-help">Private self-hosted workspace · Secure session login</p>
      <div class="login-mobile-discover"><p>Custom WordPress plugins, web apps &amp; eCommerce development by <a href="https://digitalpulse.click/" target="_blank" rel="noopener noreferrer">DigitalPulse ↗</a></p><div class="login-app-links"><a href="https://games.63.lv/" target="_blank" rel="noopener noreferrer">🎮 Games</a><a href="https://translate.63.lv/" target="_blank" rel="noopener noreferrer">🌐 Translate</a><a href="https://radio.63.lv/" target="_blank" rel="noopener noreferrer">♫ Radio</a><a href="https://whiteboard.63.lv/" target="_blank" rel="noopener noreferrer">✎ Whiteboard</a><a href="https://music-writer.63.lv/" target="_blank" rel="noopener noreferrer">♬ Music</a><a href="https://price.63.lv/" target="_blank" rel="noopener noreferrer">↗ Price</a></div></div>
      <p class="login-credit">Created by <a href="https://digitalpulse.click/" target="_blank" rel="noopener noreferrer">DigitalPulse</a></p>
    </div></div>
  </main>
  <div id="appView" class="app-shell" hidden>
    <div id="mobileShade" class="mobile-shade" hidden></div>
    <aside class="sidebar" id="sidebar"><div class="brand-wrap"><a href="#dashboard" id="brandLink" class="brand"><img src="assets/icon.svg" width="39" height="39" alt=""><span>Social <strong>63</strong><small>Social media command centre</small></span></a></div>
      <div class="sidebar-scroll"><div class="sidebar-label">WORKSPACE</div><nav id="mainNav" class="main-nav" aria-label="Main navigation"></nav><div class="sidebar-label tools-label">YOUR TOOLS</div><nav id="toolsNav" class="main-nav" aria-label="Workspace tools"></nav></div>
      <div class="sidebar-bottom"><span class="sidebar-label">ACTIVE WORKSPACE</span><button id="workspaceButton" class="workspace-button" data-nav="settings"><span class="workspace-avatar" id="workspaceAvatar">S</span><span class="workspace-text"><b id="workspaceName">My Workspace</b><small>Workspace settings</small></span><span aria-hidden="true">⌄</span></button><div class="sidebar-note"><div class="sidebar-note-icon">✦</div><b>Your creative workspace</b><p>Plan. Engage. Analyse. All in one place.</p><a href="https://digitalpulse.click/" target="_blank" rel="noopener noreferrer">Built by DigitalPulse ↗</a></div><div class="sidebar-version">SOCIAL 63 · v1.1.0</div></div>
    </aside>
    <div class="main-shell"><header class="topbar"><button id="menuButton" class="icon-button mobile-menu" aria-label="Open navigation"><span class="hamburger">☰</span></button><div class="global-search"><span id="searchIcon" class="search-icon" aria-hidden="true">⌕</span><input id="globalSearch" type="search" autocomplete="off" placeholder="Search reviews, posts, videos and more..." aria-label="Search workspace"><kbd>Ctrl K</kbd></div><div class="topbar-actions"><span class="demo-chip" id="demoChip" hidden>Sample data</span><button id="notifyButton" class="icon-button notification-button" aria-label="Notifications" title="Activity"><span id="bellIcon">♧</span><span class="notification-dot"></span></button><button id="userButton" class="user-button" aria-label="Account menu"><span class="user-avatar" id="userAvatar">R</span><span class="user-summary"><b id="userName">Account</b><small id="userRole">Owner</small></span><span class="user-chevron">⌄</span></button></div>
      <div class="top-popover" id="accountPopover" hidden></div><div class="top-popover notifications-popover" id="notificationPopover" hidden></div>
      </header><div class="main-content" id="mainContent" tabindex="-1"></div><footer class="app-footer"><span>© <span id="year"></span> Social 63. A private social media workspace.</span><span>Made by <a href="https://digitalpulse.click/" target="_blank" rel="noopener noreferrer">DigitalPulse</a> · <a href="https://games.63.lv/" target="_blank" rel="noopener noreferrer">Games 63</a> · <a href="https://radio.63.lv/" target="_blank" rel="noopener noreferrer">Radio 63</a> · <a href="https://whiteboard.63.lv/" target="_blank" rel="noopener noreferrer">Whiteboard 63</a></span></footer></div>
  </div>
  <div id="modalBackdrop" class="modal-backdrop" hidden><div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modalTitle"><div class="modal-head"><div><div class="eyebrow">SOCIAL 63 WORKSPACE</div><h2 id="modalTitle">Edit item</h2></div><button class="icon-button" id="closeModal" aria-label="Close dialog">✕</button></div><div id="modalBody"></div></div></div>
  <div id="toastContainer" class="toast-container" aria-live="polite" aria-atomic="true"></div>
</body></html>
