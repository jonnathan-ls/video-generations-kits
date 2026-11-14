# Player e correção de cenas — referência consultada

- Exemplo local: `js-3d-library/examples/misc_controls_orbit.html`, consultado em 2026-11-08. O exemplo conecta `OrbitControls` à câmera e ao canvas e distingue render no evento `change` de damping que exige um loop contínuo.
- Adaptação: inspeção pausada usa `enableDamping=false`, render exclusivamente no evento `change`, e mantém posição/alvo/campo de visão como números graváveis por cena e instante. Não há RAF adicional nem câmera interativa no caminho de render HyperFrames.
- Limite: o exemplo não implementa timeline, persistência, retorno à câmera dirigida nem revisão humana. O módulo `review-player.js` implementa essas responsabilidades como uma camada exclusiva da prévia; registros são solicitações de correção, nunca aprovações de assets.
- Base local complementar: `kit/engine/composition.js` amostra câmera e luz por tempo; a inspeção livre preserva esse estado e restaura a amostragem dirigida ao sair do modo de edição.
