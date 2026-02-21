quero fazer um site, assim parecido com o que fiz de gerador de time, porém com essas especificações:

Geral:
Primeira página precisa ter uma tela de login com django
para então abrir 3 páginas (minha ideia, mas se achar mais interessante todas em uma só beleza)

O projeto em si, seria pra ver 3 temas centrais, com intuito de sair da planilha do excel que tenho, para também utilizar no celular pois gostei muito do resultado do projeto dos times:
Acompanhamento financeiro
Acompanhamento das minhas horas trabalhadas, bem como simulação de quanto ganharia por hora extra e sálario do mês
Acompanhamento do meu fisico.

Acompanhamento financeiro 
- precisa estar conectado novamente em uma tabela do supabase
- cadastramento de gastos e ganhos fáceis:
   1. Atualmente a estrutura da minha tabela de gastos está dessa forma: 
   descrição - descrição breve;
   categoria - separados em: fixos, ganhos, salário, poupança, fatura, Saúde, Assinaturas, Variáveis -> aceito sugestão de ajustes e melhorias;
   valor;
   banco;
   forma de pagamento;
   ano_mes;
Foi feita pensando em realizar cálculos no power bi, mas acredito que ficou mal organizado e separado as colunas, quero melhorias para deixar apenas o que realmente importa para os cálculos a seguir, e reorganizar caso seja necessário.

- filtro de mês e ano na página, com possibilidade de mais de uma seleção no filtro.
- KPIs que acompanho:
   1. Ganho Total
     1.1 Gosto de ver também o salário do mês
   2. % Ganho total comparado ao mês anterior do filtro
   3. Gasto Total
   4. % Ganho total comparado ao mês anterior do filtro
   5. Lucro Total
   6. % Ganho total comparado ao mês anterior do filtro
   7. Poupança total

Basicamente os ajustes que pedi podem ser feitos baseado que o cadastro vai ser feito do que entrar, sair e vai ser guardado na poupança.

Acompanhamento das minhas horas trabalhadas:
- formatação da tabela atual no excel:
  data, qtd_horas, apontamento (basicamente o projeto que foi apontado), tipo (Normal, Adicional de produção)
- Preciso fazer o cadastramento dessas horas, e precisa ser de maneira prática, por geralmente fazer apenas no final do mês.
- gosto de ter uma visão mes a mes:
total de horas, total de horas extras, total de horas (sem hora extra)
- Devido a extra eu receber pelo meu valor hora, eu gosto de ter uma previsão do quanto eu vou receber em cada mês, sempre horas extras feitas do mês anterior, mas podemos ver posteriormente isso. Pode fazer o cálculo inicialmente com 59 o meu valor hora.
- Essa página aqui, seria interessante também fazer o cálculo do meu salário, sou cooperado, então há alguns descontos, como unimed e inss, mas veremos posteriormente também.

Acompanhamento do meu fisico.
Esse aqui não tenho uma planilha feita ainda, então pode me surpreender rsrs.
Mas basicamente, quero acompanhar minha evolução neste ano (também mês a mês) do meu peso, bem como as medidas do meu acompanhamento com a nutricionista

Data 24/11/2025 28/01/2026
Altura 1,64 m 1,64 m
Peso 81,70 kg 81,40 kg (-0,30)
IMC 30,38 30,26 (-0,11)
Massa Gorda 24,09 kg 23,23 kg (-0,85)
% Massa Gorda 29,48% 28,54% (-0,94)
Massa Magra 57,61 kg 58,17 kg (+0,55)
% Massa Magra 70,52% 71,46% (+0,94)
Razão cintura / quadril-0,92
Densidade Corporal 1,03 1,03
Soma de dobras 240,00 mm 227,00 mm
Área Muscular do Braço (AMB) 51,40 53,45 (+2,04)
Área de Gordura do Braço
(AGB) 17,85 18,17 (+0,32)
Circunferências
Ombro 112,00 cm 117,00 cm (+5,00)
Peitoral 105,00 cm 103,00 cm (-2,00)
Cintura 98,00 cm 97,00 cm (-1,00)
Abdomen 105,00 cm 106,00 cm (+1,00)
Quadril-106,00 cm
Braço relaxado direito 29,50 cm 30,00 cm (+0,50)
Braço relaxado esquerdo 29,00 cm 30,00 cm (+1,00)
Braço contraido direito 31,00 cm 31,00 cm
Braço contraido esquerdo 31,00 cm 31,00 cm
Pregas Cutâneas
Tríceps 13,00 mm 13,00 mm
Axilar Média 38,00 mm 40,00 mm (+2,00)
Tórax 20,00 mm 15,00 mm (-5,00)
Abdominal 55,00 mm 53,00 mm (-2,00)
Suprailíaca 61,00 mm 54,00 mm (-7,00)
Subescapular 40,00 mm 37,00 mm (-3,00)
Coxa 13,00 mm 15,00 mm (+2,00)


Pode utilizar também as linguagens utilizadas no projeto anterior: python, javascrip, html e css
Faça os codigos separados por liguagens