---
name: audio
description: Preparar narração em português brasileiro, alinhamento por palavras, foley sincronizado a contatos, ducking e mixagem para vídeos explicativos em 3D. Use depois do roteiro e antes de fixar os tempos das cenas.
---

Leia `kit/docs/audio.md`. Reutilize a voz do kit 3D e o áudio do stick-film; não reutilize seu visual stick. Não copiar a trilha ou a voz dos canais de referência.
Siga também `kit/docs/qualidade-audiovisual.md`: revise a fala integral como português brasileiro natural e conectado; baseie legendas no alinhamento acústico; narre capítulos; exporte `.srt` com pontuação e capitalização naturais para upload no YouTube.

Você é a LLM operadora do kit. Execute as ferramentas e edite os arquivos; não peça ao usuário para executar comandos. Ele valida e aprova pelo chat e pela aplicação.

Verifique a configuração de voz existente. Se não houver escolha aprovada, gere amostras por parágrafo e deixe o criador escolher. Não inferir uma voz em português a partir dos presets ingleses do stick-film. Fixe a voz antes da timeline.

Cada beat recebe uma palavra/instante de contato e a ação que justifica o som. Aplique impactos no contato e reserve whooshes para deslocamentos relevantes. Mantenha a voz inteligível e sons consistentes por material. O áudio é um recurso reutilizável e os tipos novos devem aparecer no catálogo e passar por revisão humana.

Para legendas progressivas, alinhe o texto exato de cada take ao áudio com `kit/tools/force-align-voice.py`, depois `kit/tools/align-caption-words.mjs`. Preserve onsets, probabilidades, hashes das tomadas e avisos de coarticulação/baixa confiança. Palavra com intervalo acústico zero pode entrar no mesmo onset da seguinte em `progressive-word`; não inventar uma duração e tratá-la como medida. A distribuição proporcional é fallback identificado. A montagem mantém narração/FX separados dos pacotes visuais para uma correção sonora não disparar nova captura 3D.

Antes de fixar a voz, escute a naturalidade do português: pronúncia, dicção, respiração, conectivos e pausas. Dê às perguntas uma entonação legível e faça a resposta entrar como continuação da ideia; não deixe o sintetizador separar um conectivo da oração seguinte. Se pontuação e segmentação induzirem pausa estranha, ajuste o roteiro e gere novamente antes de alinhar palavras ou legendas. Siga `kit/docs/audio.md`.

Use `kit/tools/sound-preview.py` para prévias, `kit/tools/audio-bridge.py` para adaptar o projeto e os scripts originais para mix/encode. Cheque stems, margem de voz e loudness. Peça a avaliação auditiva do criador para aprovar a voz e os sons; números não avaliam naturalidade. Não atribuir medições de mixagem total a um stem de FX.

Antes de apresentar uma prévia HyperFrames, confirme que `soundDesign.cues` foram compilados em `audio.events` e que o player carregou os FX locais esperados. Compare cue e contato com a fala/cena; zero efeitos no player quando há cues é bloqueio de fluxo. Não declare a escuta humana aprovada sem reprodução crítica.

A revisão de fluência cobre o texto integral, não só a abertura. Faça leitura ortográfica e de pontuação, depois leia em voz alta: corrija concordância, regência, artigos, pronomes, preposições e conjunções; evite listas faladas sem verbo, transições telegráficas e pausas que separem um conectivo de sua oração. Preserve perguntas curtas quando forem deliberadas. Títulos de capítulo também são falados e entram no alinhamento e na `.srt`. Se regravar, invalide o alinhamento daquela tomada e recalcule os offsets dos trechos seguintes, cenas, títulos e FX dependentes; nunca exiba texto novo sobre voz antiga. O player usa o relógio da voz como fonte única para cena, palavra e contato sonoro, inclusive com voz mutada; a captura usa tempo determinístico. Verifique início, meio, fim, seek e retomada; tolerâncias automáticas não aprovam dicção nem emoção.

Depois de qualquer mudança, confira o master em reprodução: voz natural e inteligível, música/ambiência na perspectiva correta, efeitos audíveis e sincronizados aos contatos/cortes, sem encobrir palavras. Diga com precisão se o mixer foi ajustado ou se a mixagem existente apenas recebeu uma nova voz; alinhar legendas ou reconstruir o WAV não significa que o mixer foi melhorado.
