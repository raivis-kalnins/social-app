# Third-party notices

Social 63 includes icon shapes and conventions inspired by Lucide's open-source iconography:

- **Lucide** — https://lucide.dev/ — MIT Licence — Copyright (c) Lucide Contributors.

Icons are included directly as SVG path markup; Social 63 does not make any CDN requests for icons. See the upstream project for its MIT licence text.

The application includes no embedded proprietary social-media assets, SDK credentials, commercial images, or external JavaScript UI frameworks.

## Optional hCaptcha integration

When an owner enables hCaptcha under **Settings → Login protection**, Social 63 loads the hCaptcha JavaScript challenge directly from hCaptcha and verifies challenge tokens with its Siteverify API. **No hCaptcha SDK is bundled** and it is not loaded while the feature is disabled. hCaptcha is a third-party service governed by its own terms and privacy policy: https://www.hcaptcha.com/ and https://www.hcaptcha.com/privacy.
