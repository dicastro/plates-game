# YouTube Playables — Official Reference Documentation

Canonical sources consulted for integration decisions. When in doubt about a Playables
behavioral requirement, verify against these before assuming — several requirements (e.g.
no in-game mute button, no Page Visibility API) are non-obvious and have directly changed
prior implementation decisions in this project.

| Document | URL |
|---|---|
| Integration requirements (pause/resume, audio, saveData/loadData, firstFrameReady/gameReady) | https://developers.google.com/youtube/gaming/playables/certification/requirements_integration |
| Design requirements (UI/icon conflicts, no exit button) | https://developers.google.com/youtube/gaming/playables/certification/requirements_design |
| Design best practices (volume controls, pause state UX, accessibility) | https://developers.google.com/youtube/gaming/playables/certification/best_practices_design |
| Monetization requirements | https://developers.google.com/youtube/gaming/playables/certification/requirements_monetization |
| Playables SDK reference | https://developers.google.com/youtube/gaming/playables/reference/sdk |
| Revision history (track upstream changes to all the above) | https://developers.google.com/youtube/gaming/playables/certification/revisionhistory |
| Test Suite | https://developers.google.com/youtube/gaming/playables/test_suite |

## Key requirements already incorporated

- No overall in-game mute button — `doc/technical/audio-engine.md` §5.
- `onPause`/`onResume` must fully stop all execution; Page Visibility API forbidden —
  `doc/technical/platform-strategy.md` §3.
- `isAudioEnabled()`/`onAudioEnabledChange()` must be respected, independent of `onPause`/
  `onResume` — `doc/technical/audio-engine.md` §6.
- No icon placed near a Playables-native action (close/mute/menu) may resemble it — pending
  visual verification once `PersistentHUD` is checked against the real YouTube UI.