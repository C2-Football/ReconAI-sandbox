# DHQ vs FantasyCalc Offensive Audit

Generated: 2026-05-02T14:45:41.509Z

Snapshot: `tests/fixtures/psycho-league-snapshot.json` (2026-03-30T20:10:32.062Z)

FantasyCalc query: https://api.fantasycalc.com/values/current?isDynasty=true&numQbs=2&numTeams=16&ppr=0.5

## Executive Read

- Matched 361 offensive players against current FantasyCalc.
- Overall offensive-rank Spearman: 0.98.
- Average absolute offensive-rank gap: 14.9 spots.
- Average absolute value gap: 32.4%.
- Full player comparison: `reports/dhq-fantasycalc-offense-comparison.csv`.

## Position Groups

| Pos | Matched | Overall Rho | Pos Rho | Avg Off Gap | Avg Pos Gap | Avg Value Gap % |
| --- | --- | --- | --- | --- | --- | --- |
| QB | 64 | 0.24 | 0.99 | 13.8 | 2.0 | 22.0 |
| RB | 98 | 0.69 | 0.97 | 14.7 | 4.5 | 23.3 |
| WR | 140 | 0.85 | 0.98 | 14.8 | 6.0 | 27.5 |
| TE | 59 | -0.23 | 0.94 | 16.6 | 3.5 | 70.7 |

## Top FantasyCalc Offensive Board

| Player | Pos | FC Off | DHQ Off | Delta | FC | DHQ |
| --- | --- | --- | --- | --- | --- | --- |
| Josh Allen | QB | 1 | 1 | 0 | 10600 | 9200 |
| Bijan Robinson | RB | 2 | 2 | 0 | 9982 | 8571 |
| Ja'Marr Chase | WR | 3 | 3 | 0 | 9728 | 8188 |
| Jaxon Smith-Njigba | WR | 4 | 5 | 1 | 9465 | 7977 |
| Jahmyr Gibbs | RB | 5 | 4 | -1 | 9405 | 8053 |
| Drake Maye | QB | 6 | 6 | 0 | 9202 | 7612 |
| Puka Nacua | WR | 7 | 7 | 0 | 8493 | 7610 |
| Jayden Daniels | QB | 8 | 8 | 0 | 7509 | 6463 |
| Brock Bowers | TE | 9 | 13 | 4 | 7440 | 6110 |
| Lamar Jackson | QB | 10 | 9 | -1 | 7298 | 6398 |
| Malik Nabers | WR | 11 | 10 | -1 | 7264 | 6361 |
| Justin Jefferson | WR | 12 | 12 | 0 | 7236 | 6188 |
| Amon-Ra St. Brown | WR | 13 | 11 | -2 | 7231 | 6341 |
| Ashton Jeanty | RB | 14 | 17 | 3 | 7109 | 5801 |
| Caleb Williams | QB | 15 | 16 | 1 | 6970 | 5869 |
| Trey McBride | TE | 16 | 14 | -2 | 6959 | 6096 |
| Joe Burrow | QB | 17 | 19 | 2 | 6660 | 5679 |
| Jeremiyah Love | RB | 18 | 15 | -3 | 6650 | 5917 |
| CeeDee Lamb | WR | 19 | 18 | -1 | 6487 | 5716 |
| De'Von Achane | RB | 20 | 20 | 0 | 6281 | 5248 |
| Patrick Mahomes | QB | 21 | 24 | 3 | 5934 | 4964 |
| Omarion Hampton | RB | 22 | 21 | -1 | 5880 | 5065 |
| Justin Herbert | QB | 23 | 23 | 0 | 5841 | 5002 |
| Drake London | WR | 24 | 22 | -2 | 5808 | 5053 |
| Jalen Hurts | QB | 25 | 26 | 1 | 5750 | 4774 |
| Jaxson Dart | QB | 26 | 25 | -1 | 5658 | 4829 |
| Tetairoa McMillan | WR | 27 | 27 | 0 | 5259 | 4461 |
| Jonathan Taylor | RB | 28 | 28 | 0 | 5230 | 4280 |
| James Cook | RB | 29 | 32 | 3 | 4985 | 4164 |
| Colston Loveland | TE | 30 | 30 | 0 | 4974 | 4271 |

## Largest DHQ Undervalues vs FantasyCalc

Positive delta means DHQ ranks the player later than FantasyCalc.

| Player | Pos | FC Off | DHQ Off | Delta | FC | DHQ |
| --- | --- | --- | --- | --- | --- | --- |
| Kaytron Allen | RB | 165 | 267 | 102 | 1441 | 525 |
| Skyler Bell | WR | 176 | 262 | 86 | 1377 | 557 |
| Kirk Cousins | QB | 193 | 272 | 79 | 1236 | 496 |
| Dontayvion Wicks | WR | 236 | 313 | 77 | 881 | 275 |
| Deshaun Watson | QB | 171 | 236 | 65 | 1402 | 778 |
| Justin Joly | TE | 240 | 300 | 60 | 859 | 337 |
| Carson Beck | QB | 130 | 184 | 54 | 1752 | 1135 |
| MarShawn Lloyd | RB | 267 | 321 | 54 | 562 | 238 |
| Antonio Williams | WR | 127 | 177 | 50 | 1803 | 1168 |
| Garrett Nussmeier | QB | 241 | 290 | 49 | 842 | 370 |
| Greg Dulcich | TE | 274 | 318 | 44 | 523 | 253 |
| Tyrone Tracy | RB | 179 | 222 | 43 | 1354 | 894 |
| Tahj Brooks | RB | 288 | 331 | 43 | 406 | 207 |
| Michael Trigg | TE | 252 | 294 | 42 | 744 | 358 |
| Drew Allar | QB | 192 | 233 | 41 | 1254 | 814 |

## Largest DHQ Overvalues vs FantasyCalc

Negative delta means DHQ ranks the player earlier than FantasyCalc.

| Player | Pos | FC Off | DHQ Off | Delta | FC | DHQ |
| --- | --- | --- | --- | --- | --- | --- |
| Jeff Caldwell | WR | 375 | 285 | -90 | 56 | 394 |
| Josh Cameron | WR | 343 | 256 | -87 | 146 | 592 |
| John Michael Gyllenborg | TE | 396 | 309 | -87 | 11 | 295 |
| Mason Taylor | TE | 227 | 154 | -73 | 964 | 1326 |
| Jack Endries | TE | 281 | 214 | -67 | 466 | 949 |
| Marlin Klein | TE | 304 | 241 | -63 | 333 | 709 |
| Sam Roush | TE | 333 | 270 | -63 | 177 | 521 |
| J'Mari Taylor | RB | 285 | 227 | -58 | 451 | 873 |
| Le'Veon Moss | RB | 270 | 213 | -57 | 547 | 954 |
| Deion Burks | WR | 271 | 215 | -56 | 540 | 948 |
| CJ Daniels | WR | 278 | 224 | -54 | 486 | 888 |
| Terrance Ferguson | TE | 221 | 169 | -52 | 1043 | 1216 |
| Anthony Richardson | QB | 231 | 183 | -48 | 923 | 1135 |
| Tyler Allgeier | RB | 170 | 123 | -47 | 1407 | 1616 |
| Taylen Green | QB | 256 | 211 | -45 | 720 | 968 |

## Pick Check

| Pick | FC Rank | FC | DHQ | Delta |
| --- | --- | --- | --- | --- |
| 2026 Pick 1.01 | 15 | 6977 | 7200 | 223 |
| 2026 Pick 1.02 | 38 | 4489 | 6207 | 1718 |
| 2026 Pick 1.03 | 41 | 4219 | 5407 | 1188 |
| 2026 Pick 1.04 | 48 | 3914 | 4763 | 849 |
| 2026 Pick 1.05 | 51 | 3832 | 4245 | 413 |
| 2026 Pick 1.06 | 69 | 3308 | 3827 | 519 |
| 2026 Pick 1.07 | 78 | 3081 | 3491 | 410 |
| 2026 Pick 1.08 | 83 | 2870 | 3220 | 350 |
| 2026 Pick 1.09 | 85 | 2781 | 3002 | 221 |
| 2026 Pick 1.10 | 89 | 2616 | 2826 | 210 |
| 2026 Pick 1.11 | 93 | 2470 | 2685 | 215 |
| 2026 Pick 1.12 | 93 | 2339 | 2571 | 232 |
| 2026 Pick 2.01 | 100 | 2221 | 1950 | -271 |
| 2026 Pick 2.02 | 103 | 2115 | 1853 | -262 |
| 2026 Pick 2.03 | 113 | 2018 | 1768 | -250 |
| 2026 Pick 2.04 | 115 | 1930 | 1694 | -236 |
| 2026 Pick 2.05 | 122 | 1849 | 1630 | -219 |
| 2026 Pick 2.06 | 129 | 1774 | 1574 | -200 |
| 2026 Pick 2.07 | 135 | 1706 | 1525 | -181 |
| 2026 Pick 2.08 | 140 | 1642 | 1483 | -159 |
| 2026 Pick 2.09 | 148 | 1583 | 1446 | -137 |
| 2026 Pick 2.10 | 154 | 1528 | 1414 | -114 |
| 2026 Pick 2.11 | 160 | 1477 | 1386 | -91 |
| 2026 Pick 2.12 | 167 | 1429 | 1362 | -67 |

## Readout

- QB context is the highest-priority model check. The comparison should treat top-32 QBs as the league starter pool in this format, not just the elite market tier.
- RB/WR gaps are mostly depth and rookie-neighborhood issues. When a player is ranked much lower by DHQ, inspect whether production gating is suppressing market rookies or young role bets too aggressively.
- TE has the largest tendency to drift because small PPG differences create unstable tiers. Keep TE scarcity tied to actual starter demand, but avoid letting low-volume TE production dominate.
- FantasyCalc does not return kickers in this endpoint. Kicker stress testing needs the DHQ lab script with Sleeper stats plus custom scoring.
