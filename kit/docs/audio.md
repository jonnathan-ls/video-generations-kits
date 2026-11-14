# Voz e som orientados à ação

Reutilização: `stick-film/audio` mantém DSP de foley, score, ducking, mixagem e encode de loudness. `kit-video-3d/tools/voz.mjs` mantém diagnóstico, geração Kokoro/ElevenLabs e alinhamento Whisper. Os desenhos stick e o motor de poses 2D não fazem parte do novo kit.

## Voz

O modelo local Kokoro do stick-film está em `~/StickFilms/.tools/kokoro` e as dependências em `~/StickFilms/.tools/venv`. A ponte `kit/tools/voice-pt.py` gera tomadas por parágrafo com idioma explícito `pt-br` e aceita as vozes `pf_dora`, `pm_alex` e `pm_santa` presentes neste modelo. Há amostras em `kit/audio/voice-samples/` para escuta; nenhuma voz foi aprovada automaticamente.

O adaptador original `stick-film/audio/tts.py` fixa `en-us`/`en-gb` e não deve ser usado diretamente para síntese em português. A ponte usa o modelo local instalado e registra duração e taxa de cada tomada; a LLM prepara a conversão para o formato do mixer, confere pronúncia, pausas e naturalidade e apresenta as opções ao criador. Fixar a narração e alinhar os tempos antes de animar o contato ou escrever legendas. Se o áudio da narração for fornecido pelo usuário, transcrever e conferir seu texto/timing antes de compor.

Antes da síntese, revise o português falado junto com a direção: concordância, regência, pronomes, conectivos e pontuação precisam soar naturais quando lidos em voz alta. Não use pontuação para simular uma pausa se ela quebrar a gramática; mantenha o “mas”, o “e” ou outro conectivo ligado à oração correta. Depois da síntese, escute perguntas e respostas: a pergunta precisa de pausa e entonação próprias, e a resposta deve entrar com ritmo e ênfase compatíveis com seu sentido. Divida o texto em unidades de raciocínio, não em fragmentos que induzem pausas artificiais. Se a voz destacar uma palavra errada, engolir uma ligação ou pausar num ponto estranho, ajuste a pontuação/segmentação suportada pelo modelo, gere de novo e então refaça alinhamento e legendas a partir da tomada escolhida.

Transcrição de referência nesta máquina:

`/home/jonnathan/scripts/extract-transcripts/extract.sh research/videos --recursive --model small --run`

O modo padrão do script é simulação; `--run` realiza a transcrição. Os modelos já disponíveis devem ser usados antes de baixar outros. A extração desta sessão usou o modelo small e GPU. Transcrições automáticas precisam de revisão, especialmente nomes técnicos e unidades.

## Foley

Criar a intenção sonora no beat: material, contato, instante, intensidade e duração. Colocar impacto no quadro de contato; antecipar uma passagem suave em aproximadamente 50–100 ms apenas quando houver deslocamento. Não usar whoosh em toda palavra ou corte. Separar som de mecanismo contínuo de pontuação narrativa. Preparar stems de voz, FX e trilha e manter pausas úteis para a demonstração.

Prévias no catálogo:

`/home/jonnathan/scripts/extract-transcripts/venv/bin/python3 kit/tools/sound-preview.py`

Esse comando usa o DSP original para `thud`, `whoosh` e `clink`; não extrai nem republica os sons dos canais. Os sons novos também passam pela aprovação humana. O DSP oferece mais tipos; adicionar metadados ao catálogo quando uma nova necessidade justificar.

## Mixagem

O wrapper `kit/tools/audio-bridge.py` converte o projeto em cues/events para o mixer original. Rever os eventos antes de mixar, não inferir impactos apenas da pontuação textual. As metas herdadas são margem de voz de pelo menos 9 dB na pior janela falada e entrega em -14 LUFS, pico verdadeiro até -1,5 dBTP, em duas passagens. São metas do kit, não medidas isoladas de FX nas referências. Conferir o resultado de ouvido com o criador; as medidas não avaliam timbre e naturalidade.

Na montagem HyperFrames, `soundDesign.cues` também precisa chegar a `audio.events`. Depois de compilar, confira no player que os arquivos locais de FX foram carregados e que os contatos aparecem nos tempos previstos; uma prévia que informa zero efeitos com cues registrados está incompleta. Isso confirma a ligação do fluxo, mas não substitui a escuta crítica da voz, dos efeitos e da mixagem.
