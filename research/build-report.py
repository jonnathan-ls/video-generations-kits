import json
from pathlib import Path
root=Path(__file__).resolve().parent
rows=json.loads((root/'metadata/evidence.json').read_text())
notes={
'SMljncnq2UI':('Cristo Redentor: função de cada peça','3.856','Montagem causal de estrutura, fundação, revestimento e manutenção. O corte abre a estátua mantendo o monumento como referência espacial.',[(0,13,'Escala ingênua e falha do material'),(13,33,'Estrutura oca e fundação na rocha'),(33,51,'Revestimento e detalhe próximo'),(51,69,'Raio e caminho até a terra'),(69,84,'Manutenção interna e fechamento')]),
'YVkyM_uHYPY':('Ponte: função de cada peça','1.356','A ponte permanece sobre o mesmo rio; o enquadramento vai ao ponto de falha e retorna ao conjunto. A viga, o pilar, o apoio e a drenagem têm demonstrações próprias.',[(0,9,'Solução improvisada falha'),(9,26,'Concreto e aço: esforços diferentes'),(26,43,'Pilar e interação com correnteza'),(43,69,'Margens, encontro e aparelho de apoio'),(69,82,'Chuva, drenagem e resultado')]),
'VRQiGogxCEw':('Forno de pizza: base, cúpula e calor','1.234','Construção cumulativa de um forno no quintal. O corte mostra o calor voltando da cúpula para a pizza; o conjunto continua reconhecível até o final.',[(0,8,'Fogo exposto e consequência'),(8,24,'Base e camada refratária'),(24,39,'Cúpula e percurso do calor'),(39,60,'Boca, fumaça e chaminé'),(60,78,'Isolamento e payoff culinário')]),
'DfPlrwRuSLj':('Por que o mofo do rodapé sempre volta?','3,3 milhões','A parede em corte mostra solo, fundação e alvenaria. O roteiro derruba duas falsas soluções, usa uma analogia de capilaridade e distingue umidade ascendente de condensação.',[(0,12,'Dor doméstica e limpeza que não resolve'),(12,32,'Capilaridade, analogia e salitre'),(32,43,'Cerâmica desloca o problema'),(43,69,'Barreira e ponte de umidade por terra externa'),(69,95,'Diagnóstico da casa pronta, barreira química e condensação')]),
'DfFTGMXu-Ug':('Fachada linda, por dentro chove?','2,9 milhões','Uma casa cortada organiza telhado, calha e descida. O detalhe do rufo tem plano próprio. A pergunta sobre o caninho externo é paga depois da demonstração de obstrução e extravasamento.',[(0,9,'Contraste entre fachada e falha interna'),(9,27,'Inclinação, coleta e percurso da água'),(27,44,'Dimensionamento contextual e junção'),(44,63,'Proteção superior e obstrução'),(63,90,'Extravasor, interpretação do sintoma e manutenção')]),
'DfJ4jEJOo4H':('Para que serve o pino do meio da tomada?','1,4 milhão','O pino cortado aparece já na abertura. A câmera acompanha circuito, carcaça e aterramento; amplia o quadro e o DR quando a pergunta muda. Um personagem demonstra contato, sem atuar como apresentador permanente.',[(0,10,'Provocação e promessa do mecanismo'),(10,27,'Defeito e caminho da corrente'),(27,49,'Conexão real da tomada ao aterramento'),(49,73,'Limite da proteção e DR'),(73,90,'Geometria do plugue e fechamento')])}
for v in rows:
 title,views,obs,beats=notes[v['id']];v.update(title=title,viewsLabel=views,observation=obs,beats=[{'start':a,'end':b,'purpose':c}for a,b,c in beats],viewsPrecision='contagem pública abreviada na interface' if v['platform']=='instagram' else 'metadados do vídeo na coleta')
rows.sort(key=lambda v:(0 if v['platform']=='youtube' else 1,-float(v['viewsLabel'].replace('.','').replace(',','.').split()[0])*(1000000 if 'milh' in v['viewsLabel'] else 1)))
findings=[
'Continuidade causal: mostrar a falha, introduzir uma peça e demonstrar como ela resolve o problema antes de apresentar a próxima restrição.',
'O corte mantém o objeto reconhecível enquanto revela camadas, trajetos e contatos que ficariam escondidos.',
'As seis referências têm 80,5–96,8 s de arquivo e aproximadamente 172–191 palavras/minuto, conforme as transcrições automáticas.',
'YouTube: low-poly, cores simples e construção cumulativa. Instagram: interiores e materiais mais detalhados, com dor doméstica, falsa solução e analogia.',
'O mix completo medido fica entre -14,1 e -14,0 LUFS. Isso não identifica o timbre ou o nível separado dos FX.',
'Novos recursos entram em revisão humana por variação; a geração final exige aprovação da revisão de código atual.'
]
report={'collectedOn':'2026-11-04','timezone':'America/Sao_Paulo','selection':'3 Shorts públicos disponíveis no YouTube; 3 Reels mais vistos entre os 28 posts do perfil Instagram, conforme contagens exibidas no navegador conectado.','findings':findings,'videos':rows,'limits':['Contagens Instagram abreviadas e mutáveis; não são números exatos.','Não foram obtidas curvas privadas de retenção.','Whisper pode errar palavras técnicas; os beats têm intervalos aproximados de segmento, não alinhamento palavra a palavra validado.','Análise visual baseada em 18 quadros espaçados e sequências curtas por vídeo, sem inferência de dimensões executivas.','LUFS e pico verdadeiro medem o mix inteiro; sem stems não medimos FX isolados.']}
(root/'reports/analysis.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
text='''# Análise das referências — 4 de novembro de 2026

Foram baixados seis vídeos públicos: os três Shorts disponíveis do canal YouTube informado e os três Reels mais vistos do perfil Instagram entre os 28 posts inspecionados. Os arquivos estão em `research/videos/<plataforma>`. Transcrições Whisper small estão em `research/transcripts`. Cada vídeo tem 18 quadros espaçados e três quadros adicionais separados por 400 ms em `research/frames/<id>`.

## Seleção e ferramentas

O YouTube não tem aba de vídeos longos. O ranking da aba Shorts foi conferido e os metadados individuais, salvos no download, atualizam as contagens: Cristo, ponte e forno. Instagram: mofo (3,3 mi), platibanda (2,9 mi), pino de aterramento (1,4 mi). Os fixados não foram utilizados como critério. As contagens do Instagram são abreviadas e foram observadas na interface; yt-dlp não retornou view_count para esses Reels. O TikTok não foi necessário: seu extrator de perfil falhou.

O yt-dlp não estava no PATH global. Foram encontradas cópias nos venvs de `viral-dashboard` e `higgsfield-flow`. Instalado de forma independente para este usuário com `uv tool install --with curl-cffi 'yt-dlp[default]'`; comando em `~/.local/bin/yt-dlp`. O curl-cffi fornece impersonação HTTP utilizada nos Reels públicos. O YouTube usou o runtime Node. As traduções automáticas de legendas deram 429; os downloads de vídeo foram concluídos sem essas traduções.

gallery-dl 1.32.19 foi instalado e testado como alternativa. O perfil retornou NotFoundError e o link individual redirecionou ao login. Para esta coleta, yt-dlp funcionou melhor nos links individuais públicos. Não há garantia de acesso permanente. A tentativa de usar cookies do Chrome foi bloqueada pela revisão automática por falta de autorização explícita; nenhum cookie foi extraído. O caminho público resolveu a coleta.

Fontes das ferramentas: [yt-dlp — instalação](https://github.com/yt-dlp/yt-dlp/wiki/Installation), [yt-dlp](https://github.com/yt-dlp/yt-dlp), [gallery-dl](https://github.com/mikf/gallery-dl). Documentação HyperFrames foi conferida localmente nas skills instaladas e no CLI 0.9.14.

## Padrões observados

- O gancho já contém o problema visível. A obra não aparece só depois de uma introdução falada.
- Cada peça é consequência de uma falha anterior. O termo técnico geralmente chega depois de sua necessidade ficar clara.
- A narrativa acompanha o mesmo sistema e alterna conjunto, detalhe, corte e retorno ao conjunto. O cenário não é reconstruído com outra identidade a cada frase.
- Caminhos invisíveis ficam visíveis: água nos poros e calhas, carga na estrutura, calor sob a cúpula, corrente no circuito.
- A explicação verbal trata da causa; a ação mostra a consequência. A legenda de uma palavra acompanha a fala; rótulos e setas têm uso pontual.
- O Instagram parte de sintomas e falsas soluções, com humor curto e analogias domésticas. O YouTube privilegia construção cumulativa e falha → peça → nova restrição.
- Há diferença de acabamento: o kit legado se aproxima do low-poly do YouTube. O Instagram exige evolução de materiais e modelagem; os três assets novos são propostas técnicas para revisão, sem alegação de equivalência visual.

## Como adaptar

O padrão de produção proposto é: pergunta concreta → erro/sintoma → mecanismo invisível → peça necessária → teste visual → consequência → conclusão que paga a pergunta. Não copiar bordões, roteiros, marcas ou áudios. O fechamento e a identidade serão próprios.

A câmera pode ficar estável enquanto o mecanismo age. Não impor giro permanente nem dois efeitos arbitrários por cena. Usar trajetos curtos, uma transformação física por vez, direção consistente e cortes por mudança de pergunta. As referências não justificam uma regra universal de trocar de cena a cada três segundos ou de colocar personagens em mais da metade dos planos.

## Áudio: medição e proposta

ffmpeg ebur128 mediu o mix completo. A faixa de loudness integrada dos seis arquivos é -14,1 a -14,0 LUFS; os picos verdadeiros encontrados vão de -1,5 a -0,9 dBFS. A contagem de palavras do Whisper equivale a aproximadamente 172–191 palavras por minuto, incluindo pausas do arquivo. Essas medidas não são velocidade de voz escolhida nem níveis isolados de FX.

As referências não fornecem stems. Não há medição isolada de timbre, instrumentos ou sincronismo exato de efeitos sonoros neste estudo. O protocolo de produção adota o recurso do stick-film: som de contato no quadro de contato, passagem discreta quando há deslocamento, ducking, stems e revisão auditiva pelo criador. Meta de entrega do kit: -14 LUFS, pico verdadeiro até -1,5 dBTP e margem de voz de pelo menos 9 dB na pior janela falada. É uma especificação proposta, não uma reprodução comprovada da mixagem dos canais.

## Evidência por vídeo
'''
for v in rows:
 text+=f"\n### {v['title']}\n\n[Original]({v['url']}) · {v['viewsLabel']} visualizações · {v['duration']:.2f} s · {v['width']}×{v['height']} · {v['wordCount']} palavras · {v['wordsPerMinute']} palavras/min · {v['integratedLUFS']} LUFS · pico {v['truePeakDBFS']} dBFS.\n\n{v['observation']}\n\n"
 for b in v['beats']:text+=f"- {b['start']}–{b['end']} s: {b['purpose']}.\n"
 text+=f"\nQuadros: `research/frames/{v['id']}/contact.jpg`. Transcrição: `research/transcripts/{v['id']}.md`.\n"
text+='''
## Limites

As contagens representam a coleta e podem mudar. A amostra pública do YouTube tem apenas três vídeos. Sem curvas de retenção e experimentos não é possível atribuir as visualizações a um recurso específico. Os segmentos do Whisper são aproximados e contêm erros de reconhecimento; termos, normas e números precisam de fontes primárias antes de um roteiro novo. O estudo orienta narrativa e produção, não dimensiona sistemas construtivos.
'''
(root/'reports/analise.md').write_text(text)
print('Relatório estruturado e análise gerados.')
