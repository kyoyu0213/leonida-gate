import { MessageSquare, Server, GitCompare } from 'lucide-react';
import ArticleLayout from '@/components/ArticleLayout';

const TITLE = 'FiveMの歴史とは？2014年の誕生からRockstar傘下入りまでの全年表';

const BODY = `FiveMは、Grand Theft Auto V（GTA5）を独自のマルチプレイヤー環境へと拡張するMODフレームワークである。今日ではGTARP（ロールプレイ）文化の中心的な基盤として知られるが、ここに至るまでの道のりは平坦ではなかった。

一個人のコミュニティプロジェクトとして始まり、Rockstar／Take-TwoからBANや法的圧力を受け、匿名的な形で復活し、最終的にはRockstar Gamesの傘下に入る——という、ゲームMOD史でも珍しい経緯をたどっている。

この記事では、FiveMが2014年に産声を上げてから2026年現在に至るまでの歴史を、年表形式で整理する。あわせて、海外ブログやまとめ記事で繰り返し拡散されている年代の誤りについても、公式発表・主要メディア報道・コミュニティ記録を区別しながら確認していく。

![GTA5のマルチプレイMODとして発展してきたFiveMの歩み](/images/FiveMnorekisi/FiveMnorekisi.png)

## 早わかり年表

| 年 | 主な出来事 |
| --- | --- |
| 2014年 | CitizenMP／FiveRebornの系譜が始動（リード開発者NTAuthority） |
| 2015年 | GTA5のPC版発売。夏に中心人物のアカウントがBAN、同年に私立探偵の接触とC&D、配布停止 |
| 2016年 | FiveMへの改名、CitizenFX Collective（CFX）体制の確立、NTAuthorityの匿名復帰 |
| 2017年 | OpenIV事件（FiveMとは別件のMODツールへのC&D）とコミュニティの大規模反発 |
| 2019年 | RedM（RDR2版）の提供開始 |
| 2021年 | 同時接続25万人に到達、GTA RPブーム |
| 2023年8月 | RockstarがCfx.reを買収（額非公表）＝Rockstar傘下入り |
| 2026年 | Cfx Marketplace始動（1月）、alt:V終了（2月）、RAGE:MP終了発表（5月） |

![FiveMの主要な出来事をまとめた年表](/images/FiveMnorekisi/FiveMnenpyou.png)

## 前史：2014年 ―― CitizenMP／FiveRebornの始動

FiveMの源流は、GTA5がPC向けに発売される前の2014年にさかのぼる。リード開発者として知られる「NTAuthority」が、CitizenMPと呼ばれるフレームワークを公開したのが出発点だった。GTA5のPC版が発売されたのは2015年4月だが、それ以前から有志のモッダーたちはコンソール版を相手に試行錯誤を続けており、PC版の登場が本格的なマルチプレイヤー実験への扉を開くことになる。

当時のGTA Onlineは、Rockstarが完全に管理する閉じた環境であり、独自のゲームモードを動かしたり、サーバーの挙動を改変したり、後にロールプレイ文化が求めることになる「持続する世界」を構築したりする余地はなかった。その空白を埋めようとした最初の本格的な試みが、CitizenMPの系譜から生まれたFiveReborn（ファイブリボーン）である。コミュニティがホストするサーバーへ接続し、改変されたGTA5を遊べるカスタムクライアントであり、同期は不安定でツールも限られていたが、構想を証明するには十分な完成度を持っていた。

![GTA5を独自サーバーで遊ぶためのフレームワークとして始まったFiveM](/images/FiveMnorekisi/fiveM.avif)

## 2015年 ―― Take-Two／RockstarによるBANと法的圧力

プロジェクトが注目を集めるにつれ、これを歓迎しない当事者が現れる。GTA5の権利を持つTake-Two InteractiveとRockstar Gamesである。当時、FiveMはGTA Onlineとは別の形で、コミュニティ主導のマルチプレイヤー環境を作ろうとしていた。両社は、収益化されないコミュニティ主導のマルチプレイヤーを、GTA Onlineに対する競合と見なしたとされる。

海外コミュニティの記録や当時の報道によれば、2015年夏、Rockstar／Take-TwoはFiveMの中心人物らのアカウントをBANした。リード開発者のNTAuthority、サポートを担っていたqaisjp、TheDeadlyDutchiらが対象とされ、その名目は「海賊行為（ピラシー）を助長する」というものだったとされる。

さらに同年、Take-Two側の私立探偵がNTAuthorityに接触し、配布停止を求める警告状（C&D）を手渡したと伝えられている。これを受け、NTAuthorityはクライアント本体の公開配布を停止した。ただし、プロジェクトを完全に放棄したわけではなく、FiveMの土台であるオープンソースのフレームワーク「CitizenFX」の開発や、コミュニティ側の試み自体が完全に途絶えたわけではなかった。

なお、後年にPC Gamerなど海外メディアが振り返ったところによれば、このときRockstar側はFiveMを「海賊行為を助長するコードを含む、非公認の代替マルチプレイヤーサービス」と位置づけていた。皮肉にも、この評価は後の買収によって正反対へと転じることになる。

## 2016年 ―― FiveMへの改名と匿名復帰

開発者本人が表舞台から退いた後も、FiveMを存続させたいと考えるコミュニティメンバーは残っていた。FiveRebornやMultiFiveといった復活プロジェクトが立ち上がり、人々がこの試みを諦めていないことを示した。海外コミュニティの記録によれば、こうした動きに後押しされる形で、2016年末までにNTAuthorityはプロジェクトへの復帰を決断する。

復帰は匿名（インコグニート）で行われ、最も原型に近かったFiveRebornと合流する形で進められた。この過程でプロジェクトは「FiveM」へと改名され、開発体制としてCitizenFX Collective（CFX）が整えられていく。匿名性を保つための仕組みも導入され、特定の個人に法的責任が集中しない構造が志向された。FiveMという名称と、現在まで続くCfx.reの体制は、この時期に骨格が形づくられている。

![FiveM／RedMを開発するチーム「Cfx.re」のロゴ](/images/FiveMnorekisi/cfx.png)

ただし、この2015〜2016年の初期経緯は、公式の一次情報というよりも、開発者・コミュニティ側の証言や当時の記録に依存する部分が大きい点には留意が必要である。

## 2017年のモッディング論争（OpenIV事件）――FiveMとの関係を正しく整理する

ここで、海外ブログやまとめ記事で頻繁に混同されている事実を整理しておきたい。GTA6 FEEDが一次報道をたどって確認したところ、「2017年にTake-TwoがFiveMへC&Dを発行した」とする記述は、別件である2017年6月のOpenIV事件との取り違えである可能性が高い。

OpenIVは、GTA5・GTA4・Max Payne 3などのシングルプレイヤー向けMODを支える、約10年の歴史を持つツールである。海外メディアの報道によれば、2017年6月5日、Take-TwoはこのOpenIVに対してC&Dを送付した。これに対しコミュニティは猛反発し、Steamでのレビュー荒らしや7万7千を超える署名運動が起きる。その結果、6月23日にTake-Two／Rockstarは、シングルプレイヤーかつ非商用で、第三者のIPを尊重するMODプロジェクトに対しては「概して法的措置を取らない」とする声明を発表した。これは、後年のモッディング容認姿勢につながる重要な転換点だった。

重要なのは、この2017年の一件がFiveMではなくOpenIVを対象としていた点である。FiveM固有の法的圧力は前述の2015年であり、両者は年も対象も異なる。FiveMが存続できた根拠としてしばしば挙げられる「著作権で保護されたゲームファイルを配布せず、正規のGTA5コピーの所有を必須とし、サーバーはプレイヤー自身のハードウェア上で動く」という設計は事実だが、これはFiveMの恒常的な法的立場を説明するものであって、2017年に独立した対FiveM訴訟があったことを意味しない。そのため、買収年を2022年とする年表や、2017年のOpenIV事件をFiveMへの措置として扱う記事は、参照時に注意が必要だ。

## 2019年 ―― RedMの登場

FiveMの技術基盤は、GTA5以外のRockstar作品にも応用される。Cfx.re公式の告知によれば、2019年10月、Red Dead Redemption 2（RDR2）向けのマルチプレイヤーMODとして「RedM」が発表された。RDR2のPC版が2019年11月5日に発売されたのを受け、その約1ヶ月後、すなわち2019年末ごろから提供が始まっている。

RedMはFiveMと同じCfx.reフレームワーク上に構築されており、西部劇世界でのロールプレイサーバーを可能にした。GTA5とRDR2という二本柱を抱えたことで、Cfx.reはRockstar作品のコミュニティ・マルチプレイヤーを横断的に支える存在となっていく。

## 2021年 ―― 同接25万人とGTA RPブーム

2020年前後のコロナ禍を背景に、GTA5のロールプレイ（GTARP）はTwitchを中心に爆発的な人気を獲得する。人気サーバーNoPixelの3.0アップデートを契機に、xQc、Summit1G、SodaPoppinといった大型配信者が次々とRPに参入し、シーン全体の露出が一気に高まった。

海外メディアの報道によれば、2021年、Cfx.re／FiveMは週末のピークで同時接続25万人に到達したことを発表した。同時期のSteam上のGTA5（GTA Online含む）の同接を上回る数字であり、本体のオンラインモードよりもMODであるFiveMの方が活発という逆転現象が話題となった。GTARPが生み出す物語性の高さが、視聴コンテンツとしての魅力を支えていた。

![警察・市民・ギャングなどを演じるGTARP（ロールプレイ）はTwitchで爆発的に広がった](/images/FiveMnorekisi/GTAon-line.png)

## 2023年8月 ―― Rockstar傘下入り＝事実上の公式化

そして2023年8月11日、歴史的な転換が訪れる。Rockstar Gamesは、FiveMとRedMを手がけるCfx.reチームの買収を発表した。買収額は非公表である。

![「Cfx.reがロックスター・ゲームスに参加」と伝えるRockstar Newswireの告知（2023年8月11日）](/images/FiveMnorekisi/newswire.png)

海外メディアおよびCrunchbaseの記録によれば、この買収は「完了済み・子会社化」として処理されており、Rockstarは公式サイト上で、Cfx.reがFiveMとRedMのチームであり、正式にRockstar Gamesの一員になったと述べた。あわせて、ロールプレイ・クリエイティブコミュニティが制作するMODを公式に許容する方向へ、自社のMODポリシーを拡張したことも示された。かつてFiveMの開発者をBANし、法的圧力をかけた側が、その同じプロジェクトを傘下に収めるという構図であり、報道の一部でも「かつて自らBANしたモッディングチームを買収した」と表現されている。

ここで言葉を正確にしておくと、2023年8月に起きたのは、あくまでCfx.reチームがRockstar Gamesの一員になった、すなわち傘下入りである。これによってFiveMは法的なグレーゾーンから公式の後ろ盾を持つ立場へと変わったが、後述するように、FiveMが「唯一の公認プラットフォーム」として明確に位置づけられるのは2026年のことである。なお、買収主体はRockstar Games名義であり、買収年は2023年8月である。「2022年」あるいは「Take-Two名義」とする記述は誤りである。

## フレームワークの進化 ―― ESXからQBCore、そしてQBOXへ

FiveMの歴史は、クライアント本体だけでなく、サーバー運営を支える「フレームワーク」の進化の歴史でもある。フレームワークとは、職業・経済・所持品・身分証といったロールプレイの基盤機能をまとめて提供する土台であり、サーバー製作者はこれを下敷きに独自の街を構築する。

初期に広く普及したのはESXである。その後、より整理された構造を持つQBCoreが台頭し、多くの日本語サーバーを含む新規サーバーで採用が進んだ。さらに近年は、QBCoreの系譜を引き継ぎつつ保守性を高めたQBOXが登場し、選択肢が広がっている。どのフレームワークを採用するかは、サーバーの設計思想や開発体制によって分かれており、現在も併存しながら発展を続けている。

## 現在（2026年）――他プラットフォーム終了とFiveM一本化

2023年の傘下入り以降、FiveMの立場はさらに強固になっている。2026年1月には、FiveM／RedM向けの公式ストアフロントであるCfx Marketplaceが始動し、ロールプレイサーバーを取り巻くクリエイター経済が制度化された。

一方で、競合だったマルチプレイヤーMODプラットフォームは相次いで姿を消している。海外メディアの報道によれば、alt:Vは2026年2月にシャットダウンを開始し、RAGE:MP（RageMP）は2026年5月25日に終了を発表、8月31日に完全終了する予定とされる。RageMP側の声明では、Rockstar／Take-Twoが、同社のプラットフォームライセンス契約（PLA）のもとでFiveMをGTA5マルチプレイヤーMODの唯一の公認プラットフォームと位置づけたことが、終了の直接的な理由として挙げられている。結果として、GTA5のマルチプレイヤーMODは事実上FiveMへの一本化が進んでいる。2023年が「傘下入り」だったとすれば、この公認プラットフォーム化がはっきりと表面化したのが2026年だと整理できる。

プレイヤー数の面でも勢いは衰えていない。2026年初頭以降、FiveMはSteam経由での起動分についてもSteamDB上で同時接続が追跡されるようになり、SteamDBによれば2026年4月12日に約21万5千人の最高記録を計上している。計測方法によって数値には幅があるものの、2026年現在も日常的に10万人を超える同時接続を維持しており、GTA5マルチプレイヤー文化の中核であり続けている。なお、FiveMはSteam上で単体販売されているわけではなく、利用には正規のGTA5が引き続き必要である。

![SteamDBの「最もプレイされたゲーム」ランキングでも上位に並ぶFiveM](/images/FiveMnorekisi/steamranking.png)

技術的な前提として、2026年6月時点では、FiveMが対応するのはGTA5のLegacy Editionのみであり、Enhanced版には対応していない点に注意が必要である。

## 確定情報・主要メディア報道・コミュニティ記録の区別

本記事は、Rockstar／Cfx.re公式発表、当時の主要メディア報道、Cfx.reフォーラムなどの公開記録をもとに整理している。ただし、2015〜2016年の初期経緯には、開発者・コミュニティ側の証言に依存する部分もある点を、あらかじめ断っておく。

そのうえで、確度の高い確定情報として扱えるのは、2017年6月のOpenIV事件（FiveMとは別件）、2019年のRedM提供開始、2021年の同接25万人到達、2023年8月11日のRockstarによるCfx.re買収（額非公表）、2026年のCfx Marketplace始動およびalt:V／RAGE:MP終了である。これらは複数の独立した情報源で裏付けられている。2015年のBANと法的圧力、2016年のFiveMへの改名と匿名復帰については、事実関係そのものは広く伝えられているものの、上記のとおりコミュニティ記録に依存する部分がある。

一方、巷で流布する「2022年買収説」「Take-Two名義での買収」「2017年にFiveMがC&Dを受けた」といった記述は、確定情報と矛盾する誤りであり、本記事はこれらを採用しない。

考察に属するのは、GTA6（2026年11月19日発売予定、PS5／Xbox Series X|S）におけるロールプレイ対応の具体的な形である。買収によってCfx.reがRockstar傘下にある以上、何らかの公式なクリエイター／UGC機能が用意される可能性は高いと海外でも見られているが、その仕様や、FiveMに相当する仕組みが新世代でどう提供されるかは、現時点で公式発表がない。GTA6のPC版時期や、新MODプラットフォーム「ROME」と称される未確認情報についても同様で、いずれも確定した事実ではない。

## 免責事項

本記事はGTA6 FEEDが各種公開情報をもとに調査・整理した解説記事であり、Rockstar GamesおよびTake-Two Interactiveとは一切関係がない。記載内容には、発表済みの確定情報のほか、海外メディア報道やコミュニティ記録、未確認情報に基づく記述が含まれる。プレイヤー数などの数値は計測方法や時点によって変動する。最新かつ正確な情報については、Cfx.reおよびRockstar Gamesの公式発表を確認されたい。また、「実際にプレイした」と称する虚偽記事や、非公式の偽予約サイトには十分注意してほしい。`;

const TITLE_EN = 'What Is the History of FiveM? The Full Timeline From Its 2014 Birth to Joining Rockstar';

const BODY_EN = `FiveM is a MOD framework that extends Grand Theft Auto V (GTA5) into its own multiplayer environment. Today it is known as a central foundation of GTARP (roleplay) culture, but the road to this point was not a smooth one.

It began as a single individual's community project, faced bans and legal pressure from Rockstar/Take-Two, revived in an anonymous form, and ultimately came under Rockstar Games—a path that is unusual even in the history of game modding.

This article organizes the history of FiveM, from when it first appeared in 2014 up to the present in 2026, in timeline form. Along the way, regarding the dating errors that are repeatedly spread on overseas blogs and roundup articles, we will check the facts while distinguishing between official announcements, major media reporting, and community records.

![The journey of FiveM, which grew as a multiplayer MOD for GTA5](/images/FiveMnorekisi/FiveMnorekisi.png)

## Quick-Reference Timeline

| Year | Main Events |
| --- | --- |
| 2014 | The CitizenMP / FiveReborn lineage starts up (lead developer NTAuthority) |
| 2015 | GTA5 PC version released. In summer, key figures' accounts are banned; in the same year, a private investigator makes contact and delivers a C&D, distribution halted |
| 2016 | Renaming to FiveM, establishment of the CitizenFX Collective (CFX) structure, NTAuthority's anonymous return |
| 2017 | The OpenIV incident (a C&D against a MOD tool unrelated to FiveM) and a large-scale community backlash |
| 2019 | RedM (the RDR2 version) becomes available |
| 2021 | Reaches 250,000 concurrent players, the GTA RP boom |
| August 2023 | Rockstar acquires Cfx.re (amount undisclosed) = coming under Rockstar |
| 2026 | Cfx Marketplace launches (January), alt:V shuts down (February), RAGE:MP announces shutdown (May) |

![A timeline summarizing the major events of FiveM](/images/FiveMnorekisi/FiveMnenpyou.png)

## Prehistory: 2014 — The Start of CitizenMP / FiveReborn

The origins of FiveM go back to 2014, before GTA5 was released for PC. The starting point was when "NTAuthority," known as the lead developer, published a framework called CitizenMP. The PC version of GTA5 was released in April 2015, but even before that, volunteer modders had continued their trial and error against the console version, and the arrival of the PC version would open the door to full-fledged multiplayer experimentation.

GTA Online at the time was a closed environment fully controlled by Rockstar, with no room to run custom game modes, alter server behavior, or build the "persistent world" that roleplay culture would later demand. The first serious attempt to fill that void was FiveReborn, born from the CitizenMP lineage. It was a custom client that connected to community-hosted servers and let you play a modified GTA5; synchronization was unstable and tools were limited, but it had enough polish to prove the concept.

![FiveM, which began as a framework for playing GTA5 on independent servers](/images/FiveMnorekisi/fiveM.avif)

## 2015 — Bans and Legal Pressure From Take-Two / Rockstar

As the project drew attention, parties who did not welcome it appeared: Take-Two Interactive and Rockstar Games, who hold the rights to GTA5. At the time, FiveM was trying to create a community-driven multiplayer environment in a form separate from GTA Online. The two companies are said to have viewed a non-monetized, community-driven multiplayer as a competitor to GTA Online.

According to overseas community records and reporting from the time, in the summer of 2015, Rockstar/Take-Two banned the accounts of FiveM's key figures. Lead developer NTAuthority, qaisjp who handled support, TheDeadlyDutchi, and others were said to be targeted, on the stated grounds that they were "promoting piracy."

Furthermore, in the same year, it is reported that a private investigator on Take-Two's side made contact with NTAuthority and handed over a cease-and-desist (C&D) letter demanding that distribution be stopped. In response, NTAuthority halted public distribution of the client itself. However, the project was not entirely abandoned; development of "CitizenFX," the open-source framework that forms the basis of FiveM, and the community's own efforts did not completely cease.

Incidentally, according to how overseas media such as PC Gamer looked back in later years, at this time Rockstar's side positioned FiveM as "an unauthorized alternative multiplayer service containing code that promotes piracy." Ironically, this assessment would later flip to the exact opposite with the acquisition.

## 2016 — Renaming to FiveM and the Anonymous Return

Even after the developer himself withdrew from the public stage, community members who wanted to keep FiveM alive remained. Revival projects such as FiveReborn and MultiFive sprang up, showing that people had not given up on this effort. According to overseas community records, pushed along by such moves, by the end of 2016 NTAuthority decided to return to the project.

The return was made anonymously (incognito), proceeding in the form of merging with FiveReborn, which was closest to the original. In this process the project was renamed "FiveM," and the CitizenFX Collective (CFX) was put in place as the development structure. Mechanisms to maintain anonymity were also introduced, aiming for a structure in which legal responsibility would not concentrate on any specific individual. The name FiveM and the Cfx.re structure that continues to this day had their framework shaped during this period.

![The logo of Cfx.re, the team that develops FiveM/RedM](/images/FiveMnorekisi/cfx.png)

That said, it must be noted that this early history of 2015–2016 depends largely on testimony from the developer and community side, and records from the time, rather than on official primary sources.

## The 2017 Modding Controversy (The OpenIV Incident) — Correctly Sorting Out Its Relationship With FiveM

Here we want to sort out a fact frequently conflated on overseas blogs and roundup articles. As GTA6 FEED confirmed by tracing the primary reporting, the description that "in 2017 Take-Two issued a C&D against FiveM" is highly likely to be a mix-up with the separate June 2017 OpenIV incident.

OpenIV is a tool with about ten years of history that supports single-player MODs for GTA5, GTA4, Max Payne 3, and more. According to overseas media reporting, on June 5, 2017, Take-Two sent a C&D against this OpenIV. The community fiercely pushed back against this, with review-bombing on Steam and a petition campaign exceeding 77,000 signatures. As a result, on June 23, Take-Two/Rockstar issued a statement saying that for MOD projects that are single-player, non-commercial, and respect third-party IP, they "generally will not take legal action." This was an important turning point that led to the modding-tolerant stance of later years.

What is important is that this 2017 matter targeted OpenIV, not FiveM. FiveM's specific legal pressure was in 2015 as described above; the two differ in both year and target. The design often cited as the basis for FiveM's survival—"it does not distribute copyright-protected game files, requires ownership of a legitimate copy of GTA5, and runs servers on players' own hardware"—is a fact, but this explains FiveM's standing legal position; it does not mean there was an independent lawsuit against FiveM in 2017. For that reason, timelines that put the acquisition year at 2022, or articles that treat the 2017 OpenIV incident as an action against FiveM, require caution when referenced.

## 2019 — The Appearance of RedM

FiveM's technical foundation was also applied to Rockstar titles other than GTA5. According to Cfx.re's official announcement, in October 2019, "RedM" was announced as a multiplayer MOD for Red Dead Redemption 2 (RDR2). Following the release of the PC version of RDR2 on November 5, 2019, it became available about a month later, that is, around the end of 2019.

RedM is built on the same Cfx.re framework as FiveM, and it enabled roleplay servers in a Western world. By holding two pillars in GTA5 and RDR2, Cfx.re became an entity that supports community multiplayer across Rockstar titles.

## 2021 — 250,000 Concurrent Players and the GTA RP Boom

Against the backdrop of the COVID-19 pandemic around 2020, GTA5 roleplay (GTARP) gained explosive popularity, centered on Twitch. Triggered by the 3.0 update of the popular server NoPixel, major streamers such as xQc, Summit1G, and SodaPoppin entered RP one after another, and the exposure of the entire scene rose all at once.

According to overseas media reporting, in 2021, Cfx.re/FiveM announced that it had reached 250,000 concurrent players at weekend peaks. This was a figure exceeding the concurrent count of GTA5 (including GTA Online) on Steam during the same period, and the reversal phenomenon—where the MOD FiveM was more active than the base game's online mode—became a topic of conversation. The high narrative quality that GTARP generates supported its appeal as viewing content.

![GTARP (roleplay), where players act as police, civilians, gangs, and more, spread explosively on Twitch](/images/FiveMnorekisi/GTAon-line.png)

## August 2023 — Coming Under Rockstar = De Facto Officialization

Then, on August 11, 2023, a historic turning point arrived. Rockstar Games announced the acquisition of the Cfx.re team behind FiveM and RedM. The acquisition amount is undisclosed.

![The Rockstar Newswire announcement reporting that "Cfx.re joins Rockstar Games" (August 11, 2023)](/images/FiveMnorekisi/newswire.png)

According to overseas media and Crunchbase records, this acquisition was processed as "completed / made a subsidiary," and Rockstar stated on its official site that Cfx.re is the team behind FiveM and RedM and had officially become part of Rockstar Games. Alongside this, it was indicated that the company had expanded its MOD policy in the direction of officially permitting MODs created by the roleplay and creative community. It was a structure in which the side that had once banned FiveM's developers and applied legal pressure took that same project under its wing, and some reporting expressed it as "acquiring the modding team it had once banned itself."

To be precise with the wording here, what happened in August 2023 was strictly that the Cfx.re team became part of Rockstar Games—that is, came under Rockstar. With this, FiveM changed from a legal gray zone to a position with official backing, but as described later, FiveM being clearly positioned as the "sole authorized platform" is something that happens in 2026. Note that the acquiring entity is under the Rockstar Games name, and the acquisition year is August 2023. Descriptions saying "2022" or "under the Take-Two name" are erroneous.

## The Evolution of Frameworks — From ESX to QBCore, and Then QBOX

The history of FiveM is also a history of the evolution of the "frameworks" that support server operation, not just the client itself. A framework is a foundation that bundles together the base functions of roleplay—jobs, economy, inventory, ID cards, and so on—and server creators build their own cities on top of it.

What spread widely in the early days was ESX. Afterward, QBCore, which has a more organized structure, rose to prominence, and its adoption progressed in new servers, including many Japanese-language servers. Furthermore, in recent years, QBOX has appeared, inheriting the QBCore lineage while improving maintainability, broadening the options. Which framework to adopt is divided according to a server's design philosophy and development structure, and they continue to develop while coexisting even now.

## The Present (2026) — Other Platforms Shutting Down and Consolidation Onto FiveM

Since coming under Rockstar in 2023, FiveM's position has become even more solid. In January 2026, the Cfx Marketplace, an official storefront for FiveM/RedM, launched, institutionalizing the creator economy surrounding roleplay servers.

On the other hand, the multiplayer MOD platforms that had been competitors are disappearing one after another. According to overseas media reporting, alt:V began shutting down in February 2026, and RAGE:MP (RageMP) announced its end on May 25, 2026, with a full shutdown scheduled for August 31. In RageMP's statement, the fact that Rockstar/Take-Two positioned FiveM as the sole authorized platform for GTA5 multiplayer MODs under its Platform License Agreement (PLA) is cited as the direct reason for the shutdown. As a result, GTA5 multiplayer MODs are effectively consolidating onto FiveM. If 2023 was "coming under Rockstar," then 2026 can be organized as the year in which this becoming-the-authorized-platform clearly surfaced.

In terms of player numbers, the momentum has not waned either. Since early 2026, concurrent players for FiveM launched via Steam have also come to be tracked on SteamDB, and according to SteamDB, a record high of about 215,000 was recorded on April 12, 2026. While the figures vary depending on the measurement method, as of 2026 it routinely maintains over 100,000 concurrent players and remains at the core of GTA5 multiplayer culture. Note that FiveM is not sold separately on Steam, and a legitimate copy of GTA5 continues to be required to use it.

![FiveM also ranks high on SteamDB's "most played games" chart](/images/FiveMnorekisi/steamranking.png)

As a technical premise, as of June 2026, note that FiveM supports only the Legacy Edition of GTA5 and does not support the Enhanced edition.

## Distinguishing Confirmed Information, Major Media Reporting, and Community Records

This article is organized based on Rockstar/Cfx.re official announcements, major media reporting from the time, and public records such as the Cfx.re forums. However, we note in advance that the early history of 2015–2016 also depends in part on testimony from the developer and community side.

On that basis, what can be treated as high-confidence confirmed information is the June 2017 OpenIV incident (unrelated to FiveM), the 2019 start of RedM, the 2021 reaching of 250,000 concurrent players, the August 11, 2023 acquisition of Cfx.re by Rockstar (amount undisclosed), and the 2026 launch of the Cfx Marketplace and the shutdowns of alt:V and RAGE:MP. These are backed by multiple independent sources. As for the 2015 bans and legal pressure, and the 2016 renaming to FiveM and anonymous return, while the facts themselves are widely reported, they depend in part on community records as noted above.

On the other hand, descriptions circulating in the wild such as the "2022 acquisition theory," "acquisition under the Take-Two name," and "FiveM received a C&D in 2017" are errors that contradict the confirmed information, and this article does not adopt them.

What belongs to the realm of speculation is the specific form of roleplay support in GTA6 (scheduled for release November 19, 2026, PS5 / Xbox Series X|S). Since the acquisition put Cfx.re under Rockstar, it is widely seen overseas that there is a high possibility some kind of official creator/UGC functionality will be prepared, but there is no official announcement at this point about its specifications or how a mechanism equivalent to FiveM will be provided on the new generation. The same goes for the timing of GTA6's PC version and the unconfirmed information referred to as the new MOD platform "ROME"; none of these are confirmed facts.

## Disclaimer

This article is an explanatory piece researched and organized by GTA6 FEED based on various publicly available information, and it has no relationship whatsoever with Rockstar Games or Take-Two Interactive. The contents include, in addition to confirmed information that has been announced, descriptions based on overseas media reporting, community records, and unconfirmed information. Figures such as player counts vary depending on the measurement method and the point in time. For the latest and accurate information, please check the official announcements from Cfx.re and Rockstar Games. Also, please be sufficiently wary of false articles claiming to have "actually played" and of unofficial fake pre-order sites.`;

export default function FivemHistoryArticle() {
  return (
    <ArticleLayout
      seoTitle="FiveMの歴史とは？｜2014年の誕生からRockstar傘下入りまでの全年表｜GTA6 FEED"
      seoDesc="FiveM（ファイブエム）の歴史を年表で解説。2014年のCitizenMP/FiveRebornから、2015年のBAN・法的圧力、2016年の改名と匿名復帰、2017年OpenIV事件との混同、2023年8月のRockstar傘下入り、2026年の他プラットフォーム終了まで、公式情報とコミュニティ記録を区別して整理します。"
      title={TITLE}
      titleEn={TITLE_EN}
      icon="📜"
      date="2026-06-27"
      body={BODY}
      bodyEn={BODY_EN}
      seoTitleEn="What Is the History of FiveM? | The Full Timeline From Its 2014 Birth to Joining Rockstar | GTA6 FEED"
      seoDescEn="A timeline guide to the history of FiveM: from CitizenMP/FiveReborn in 2014, the 2015 bans and legal pressure, the 2016 rename and anonymous return, the conflation with the 2017 OpenIV incident, coming under Rockstar in August 2023, to the 2026 shutdown of rival platforms — distinguishing official information from community records."
      aiSummary={[
        'FiveMはPC版GTA5向けのMODフレームワーク。2014年のCitizenMP/FiveRebornに始まり、一個人のプロジェクトから始まった。',
        '2015年にRockstar/Take-TwoからBAN・C&Dを受けて配布停止、2016年に「FiveM」へ改名し匿名復帰。2017年のC&DはFiveMではなく別件のOpenIV事件で、混同が広まっている。',
        '2023年8月にRockstarがCfx.reを買収し傘下入り（額非公表）。2026年はCfx Marketplace始動とalt:V/RAGE:MP終了でFiveM一本化が進む。「2022年買収」「Take-Two名義」は誤り。',
      ]}
      aiSummaryEn={[
        'FiveM is a MOD framework for PC GTA5, starting with CitizenMP/FiveReborn in 2014 as a single individual’s project.',
        'In 2015 it faced bans and a C&D from Rockstar/Take-Two and halted distribution; in 2016 it was renamed "FiveM" and returned anonymously. The 2017 C&D was the separate OpenIV incident, not FiveM, a conflation that has spread widely.',
        'In August 2023 Rockstar acquired Cfx.re, bringing it under Rockstar (amount undisclosed). In 2026, the Cfx Marketplace launch and the shutdowns of alt:V/RAGE:MP advance consolidation onto FiveM. "2022 acquisition" and "under the Take-Two name" are errors.',
      ]}
    >
      <div className="flex flex-wrap gap-3 mb-12">
        <a
          href="/fivem-gtarp/what-is-fivem"
          className="inline-flex items-center gap-2 px-4 h-10 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-sm rounded transition-colors"
        >
          <Server size={14} /> FiveMとは？
        </a>
        <a
          href="/fivem-gtarp/fivem-vs-gtarp"
          className="inline-flex items-center gap-2 px-4 h-10 bg-black hover:bg-zinc-800 text-white font-mono text-sm rounded transition-colors border border-white/20"
        >
          <GitCompare size={14} /> FiveMとGTARPの違い
        </a>
        <a
          href="/board/gtarp"
          className="inline-flex items-center gap-2 px-4 h-10 bg-pink-600 hover:bg-pink-500 text-white font-mono text-sm rounded transition-colors"
        >
          <MessageSquare size={14} /> GTARP掲示板で語る
        </a>
      </div>
    </ArticleLayout>
  );
}
