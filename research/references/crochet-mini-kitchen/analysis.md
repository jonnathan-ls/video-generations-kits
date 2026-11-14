# Análise do Reel Dck3Gz1SHr0

## Origem e limites

- URL fornecida: https://www.instagram.com/reel/Dck3Gz1SHr0/
- Perfil público identificado pelo `yt-dlp`: Crochet Miniature Kitchen (`crochet.mini.kitchen`).
- Título/descrição pública: “Video by crochet.mini.kitchen”; “kitchen cleaning day”.
- Arquivo local de análise: `source.mp4`; SHA-256 `b63e41ad90791c4ee3b86c32e4eb266076acd3743bad1456fb5cce3489732b55`.
- Duração 29,375 s, vertical 1080×1920, vídeo VP9 60 fps e áudio AAC estéreo 44,1 kHz.
- Foram extraídos 294 quadros a 10 fps (intervalo de 0,1 s) em `frames/`; as folhas de contato em `contact-sheets/` permitem inspecionar toda a sequência. `frame-differences.json` guarda diferenças visuais consecutivas. O detector FFmpeg `scene` é apenas uma lista de candidatos: movimentos da mão, objetos e transformações da própria imagem também disparam o limiar, portanto não é uma contagem automática de cortes.
- A transcrição local não foi obtida: o conector Flow informou que `whisper.cpp` não está instalado. A inspeção auditiva da trilha e dos efeitos também não foi concluída. Não inferir música, foley, fala nem sincronismo por medição de volume.
- O vídeo é de **limpeza de cozinha em crochê**, não de preparo/cozimento de comida. A sequência foi modelada como limpeza visual sem narração, conforme a intenção descrita pelo criador.
- O arquivo e seus quadros ficam como referência de pesquisa; não entram como imagem/vídeo de condicionamento do Wan2GP nem como material da montagem. Não há licença de reutilização verificada.

## Sequência observada a 10 fps

| Trecho aproximado | Acontecimento e enquadramento | Função de atenção |
|---|---|---|
| 0,00–3,65 s | Macro na pia: pratos empilhados, água, esponja, espuma, enxágue. | Mão e água entram logo no início; loops de crochê muito perto da lente. |
| 3,65–6,92 s | Continuação na pia com recipientes menores, esfregar, enxaguar e pôr no escorredor. | A ação progride para um resultado visível e troca de escala/objeto dentro do mesmo espaço. |
| 6,92–10,77 s | Corte para fogão: botões, superfície, espuma e pano em planos médio e macro. | Contatos rápidos e detalhe de superfície; vários inserts mantêm a mão em movimento. |
| 10,77–14,02 s | Plano mais aberto da cozinha; migalhas no piso, varrer, recolher em pá e levar à lixeira. | Pequeno problema visível → coleta → desaparecimento das migalhas. |
| 14,02–17,36 s | Geladeira abre; itens saem, prateleira é acessada e limpa; planos aproximados do interior. | Grande mudança de objeto e fundo; macro dentro do eletrodoméstico. |
| 17,36–19,89 s | Reposição de frascos e alimentos na geladeira; planos próximos de cada item. | Resultado colorido por fileiras, com contatos curtos. |
| 19,89–22,25 s | Armário despensa abre; potes são ordenados, utensílios são pendurados. | Uma nova superfície de organização e repetição de pequenos encaixes. |
| 22,25–23,80 s | Pano é dobrado e colocado; armário pronto aparece em quadro mais largo. | Pequeno payoff antes da montagem de retoques finais. |
| 23,80–25,20 s | Insertes de pia e bancada sendo passadas com pano. | Retornos rápidos ao mesmo espaço mudam o alvo da mão. |
| 25,20–26,78 s | Fogão é passado e utensílios voltam à posição. | Repetição de textura + reset legível do conjunto. |
| 26,78–27,97 s | Toalha colorida, gotinhas na bancada e uma última passada. | Acento de cor e detalhe brilhante de acabamento. |
| 27,97–29,375 s | Plano geral vertical da cozinha limpa, sustentado até o fim. | Pagamento visual e pausa de leitura do conjunto. |

Os pontos de transição percebidos ficam perto de 3,65; 6,92; 10,77; 14,02; 17,36; 19,89; 22,25; 23,80; 25,20; 26,78 e 27,97 s. Alguns blocos contêm cortes/inserts menores. Os tempos são estimativas amostradas a 0,1 s, não timecodes de edição exportados pelo Instagram.

## Padrões para adaptação original

- A retenção visual observada vem da mudança frequente do alvo (louça → fogão → migalhas → geladeira → despensa → retoques → cozinha inteira), com ações táteis contínuas dentro de cada plano. É uma hipótese de direção, não uma medida de retenção.
- Manter planos verticais macro durante o trabalho, variar para médio quando a orientação espacial precisa voltar e guardar o único plano geral longo para o fechamento.
- Dar a cada insert um evento e um resultado legível; evitar cortes aleatórios sem conclusão da ação.
- Preservar materialidade de crochê em superfícies e objetos. Para criar uma peça própria, mudar a paleta e o desenho do mobiliário, mãos, utensílios e arranjo da cozinha.
- Foley e música serão originais e separados do vídeo-fonte. A referência visual não basta para alegar como a trilha original soa.

## Referência de qualidade disponível

O catálogo local tem `cozinha_corte`, mas é uma cena arquitetônica de outra linguagem e não um baseline aprovado de crochê, fio ou miniatura. Não há baseline de qualidade aprovado pertinente a este estilo. O Reel orienta a observação da ação; não é aprovação estética nem especificação técnica.
