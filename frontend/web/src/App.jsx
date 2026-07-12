import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

// All ~2500 official Dutch woonplaatsen (towns, villages, kernen — per the CBS/BAG
// woonplaatsenlijst, table 86097NED) grouped by their Veiligheidsregio (via gemeente,
// per CBS table 86059NED "Gebieden in Nederland 2025").
// Region names must match the `region` field in P2000 alert data exactly (case-insensitive fallback below).
const PLACES = {
  "Amsterdam-Amstelland": ["Aalsmeer","Amstelveen","Amsterdam","Amsterdam-Duivendrecht","De Kwakel","Diemen","Duivendrecht","Kudelstaart","Ouderkerk aan de Amstel","Uithoorn","Weesp"],
  "Brabant-Noord": ["'s-Hertogenbosch","Beers NB","Berghem","Berlicum","Beugen","Boekel","Boxmeer","Boxtel","Cromvoirt","Cuijk","Demen","Den Dungen","Deursen-Dennenburg","Dieden","Doeveren","Drunen","Elshout","Erp","Esch","Escharen","Gassel","Geffen","Gemonde","Grave","Groeningen","Haarsteeg","Haps","Haren","Hedikhuizen","Heesbeen","Heesch","Heeswijk-Dinther","Helvoirt","Herpen","Herpt","Heusden","Holthees","Huisseling","Katwijk NB","Keent","Landhorst","Langenboom","Ledeacker","Liempde","Linden","Lith","Lithoijen","Loosbroek","Maashees","Macharen","Maren-Kessel","Megen","Mill","Neerlangel","Neerloon","Nieuwkuijk","Nistelrode","Nuland","Odiliapeel","Oeffelt","Oijen","Oploo","Oss","Oudheusden","Overlangel","Overloon","Ravenstein","Reek","Rijkevoort","Rijkevoort-De Walsert","Rosmalen","Sambeek","Schaijk","Schijndel","Sint Agatha","Sint Anthonis","Sint Hubert","Sint-Michielsgestel","Sint-Oedenrode","Stevensbeek","Teeffelen","Uden","Veghel","Velp","Venhorst","Vianen NB","Vierlingsbeek","Vinkel","Vlijmen","Volkel","Vorstenbosch","Vortum-Mullem","Vught","Wanroij","Westerbeek","Wilbertoord","Zeeland"],
  "Brabant-Zuidoost": ["Aarle-Rixtel","Asten","Bakel","Beek en Donk","Bergeijk","Best","Bladel","Budel","Budel-Dorplein","Budel-Schoot","Casteren","De Mortel","De Rips","Deurne","Duizel","Eersel","Eindhoven","Elsendorp","Gastel","Geldrop","Gemert","Handel","Hapert","Heeze","Helenaveen","Helmond","Heusden","Hooge Mierde","Hoogeloon","Hulsel","Knegsel","Lage Mierde","Leende","Lierop","Lieshout","Liessel","Luyksgestel","Maarheeze","Mariahout","Mierlo","Milheeze","Neerkant","Netersel","Nuenen","Oirschot","Ommel","Oost West en Middelbeers","Reusel","Riethoven","Soerendonk","Someren","Son en Breugel","Steensel","Sterksel","Valkenswaard","Veldhoven","Vessem","Vlierden","Waalre","Westerhoven","Wintelre"],
  "Drenthe": ["'t Haantje","1e Exloërmond","2e Exloërmond","2e Valthermond","Aalden","Alteveer","Alteveer gem Hoogeveen","Amen","Anderen","Anloo","Annen","Annerveenschekanaal","Ansen","Assen","Balinge","Balloërveld","Balloo","Barger-Compascuum","Beilen","Benneveld","Borger","Boschoord","Bovensmilde","Broekhuizen","Bronneger","Bronnegerveen","Bruntinge","Buinen","Buinerveen","Bunne","Coevorden","Dalen","Dalerpeel","Dalerveen","Darp","De Groeve","De Kiel","De Punt","De Schiphorst","de Wijk","Deurze","Diever","Dieverbrug","Diphoorn","Doldersum","Donderen","Drijber","Drogteropslagen","Drouwen","Drouwenermond","Drouwenerveen","Dwingeloo","Echten","Eelde","Eelderwolde","Een","Een-West","Ees","Eesergroen","Eeserveen","Eext","Eexterveen","Eexterveenschekanaal","Eexterzandvoort","Ekehaar","Eldersloo","Eleveld","Elim","Ellertshaar","Elp","Emmen","Emmer-Compascuum","Erica","Erm","Eursinge","Exloërveen","Exloo","Fluitenberg","Foxwolde","Frederiksoord","Garminge","Gasselte","Gasselternijveen","Gasselternijveenschemond","Gasteren","Geelbroek","Gees","Geesbrug","Geeuwenbrug","Gieten","Gieterveen","Grolloo","Havelte","Havelterberg","Hijken","Hollandscheveld","Holsloot","Hoogersmilde","Hoogeveen","Hooghalen","Huis ter Heide","Kerkenveld","Klazienaveen","Klazienaveen-Noord","Klijndijk","Koekange","Langelo","Leutingewolde","Lieveren","Linde","Loon","Mantinge","Marwijksoord","Matsloot","Meppel","Meppen","Midlaren","Nietap","Nieuw Annerveen","Nieuw-Amsterdam","Nieuw-Balinge","Nieuw-Buinen","Nieuw-Dordrecht","Nieuw-Roden","Nieuw-Schoonebeek","Nieuw-Weerdinge","Nieuwediep","Nieuweroord","Nieuwlande","Nieuwlande Coevorden","Nijensleek","Nijeveen","Nijlande","Nooitgedacht","Noord-Sleen","Noordscheschut","Norg","Odoorn","Odoornerveen","Oosterhesselen","Oranje","Orvelte","Oud Annerveen","Oude Willem","Oudemolen","Papenvoort","Paterswolde","Peest","Peize","Pesse","Rhee","Roden","Roderesch","Roderwolde","Rogat","Rolde","Roswinkel","Ruinen","Ruinerwold","Schipborg","Schoonebeek","Schoonloo","Schoonoord","Sleen","Smilde","Spier","Spijkerboor","Steenbergen","Stieltjeskanaal","Stuifzand","Taarlo","Ter Aard","Tiendeveen","Tynaarlo","Ubbena","Uffelte","Valthe","Valthermond","Veenhuizen","Veeningen","Veenoord","Vledder","Vledderveen","Vredenheim","Vries","Wachtum","Wapse","Wapserveen","Wateren","Weiteveen","Westdorp","Westerbork","Westervelde","Wezup","Wezuperbrug","Wijster","Wilhelminaoord","Winde","Wittelte","Witteveen","Yde","Zandberg","Zandpol","Zeegse","Zeijen","Zeijerveen","Zeijerveld","Zorgvlied","Zuidlaarderveen","Zuidlaren","Zuidveld","Zuidvelde","Zuidwolde","Zwartemeer","Zweeloo","Zwiggelte","Zwinderen"],
  "Flevoland": ["Almere","Bant","Biddinghuizen","Creil","Dronten","Emmeloord","Ens","Espel","Kraggenburg","Lelystad","Luttelgeest","Marknesse","Nagele","Rutten","Schokland","Swifterbant","Tollebeek","Urk","Zeewolde"],
  "Friesland": ["Aalsum","Abbega","Achlum","Akkrum","Akmarijp","Alde Leie","Aldeboarn","Aldtsjerk","Aldwâld","Allingawier","Appelscha","Arum","Augsbuert-Lytsewâld","Augustinusga","Baaiduinen","Baaium","Baard","Bakhuizen","Bakkeveen","Balk","Ballum","Bantega","Bears","Beetsterzwaag","Berltsum","Bitgum","Bitgummole","Blauwhuis","Blesdijke","Blessum","Blije","Boarnwert","Boazum","Boelenslaan","Boer","Boijl","Boksum","Bolsward","Bontebok","Boornbergum","Boornzwaag","Brantgum","Breezanddijk","Britsum","Britswert","Broek","Broeksterwâld","Buitenpost","Burdaard","Buren","Burgum","Burgwerd","Burum","Cornwerd","Damwâld","De Blesse","De Falom","De Hoeve","De Knipe","De Tike","De Trieme","De Veenhoop","De Westereen","De Wilgen","Dearsum","Dedgum","Deinum","Delfstrahuizen","Dijken","Dokkum","Dongjum","Doniaga","Donkerbroek","Drachten","Drachten-Azeven","Drachtstercompagnie","Driezum","Drogeham","Dronryp","Eagum","Eanjum","Earnewâld","Easterein","Easterlittens","Eastermar","Easternijtsjerk","Easterwierrum","Eastrum","Echten","Echtenerbrug","Eesterga","Elahuizen","Elsloo","Exmorra","Feankleaster","Feanwâlden","Feinsum","Ferwert","Ferwoude","Firdgum","Fochteloo","Follega","Folsgare","Formerum","Foudgum","Franeker","Friens","Frieschepalen","Gaast","Gaastmeer","Garyp","Gauw","Gerkesklooster","Gersloot","Ginnum","Goënga","Goëngahuizen","Goingarijp","Gorredijk","Goutum","Greonterp","Grou","Gytsjerk","Hallum","Hantum","Hantumerútbuorren","Hantumhuzen","Harich","Harkema","Harlingen","Hartwerd","Haskerdijken","Haskerhorne","Haule","Haulerwijk","Hee","Heeg","Heerenveen","Hegebeintum","Hemelum","Hempens","Hemrik","Herbaijum","Hiaure","Hichtum","Hidaard","Hieslum","Hijum","Hilaard","Hindeloopen","Hinnaard","Hitzum","Hollum","Holwert","Hommerts","Hoorn","Hoornsterzwaag","Houtigehage","Húns","Hurdegaryp","Idaerd","Idsegahuizum","Idskenhuizen","Idzega","Ie","Iens","IJlst","Indijk","Ingelum","Ingwierrum","It Heidenskip","Itens","Jannum","Jellum","Jelsum","Jirnsum","Jislum","Jistrum","Jonkerslân","Jorwert","Joure","Jouswier","Jubbega","Jutrijp","Kaard","Katlijk","Kimswerd","Kinnum","Klooster Lidlum","Koarnjum","Kolderwolde","Kollum","Kollumerpomp","Kollumersweach","Kootstertille","Kornwerderzand","Kortehemmen","Koudum","Koufurderrige","Kûbaard","Landerum","Langedijke","Langelille","Langezwaag","Langweer","Leeuwarden","Legemeer","Lekkum","Lemmer","Leons","Lichtaard","Lies","Lippenhuizen","Ljussens","Loënga","Lollum","Longerhouw","Luinjeberd","Luxwoude","Lytsewierrum","Makkinga","Makkum","Mantgum","Marrum","Marsum","Menaam","Midlum","Midsland","Miedum","Mildam","Minnertsga","Mirns","Mitselwier","Moarre","Moddergat","Molkwerum","Mûnein","Munnekeburen","Munnekezijl","Nes","Nieuwebrug","Nieuwehorne","Nieuweschoot","Nij Altoenae","Nij Beets","Nijeberkoop","Nijega","Nijehaske","Nijeholtpade","Nijeholtwolde","Nijelamer","Nijemirdum","Nijetrijne","Nijewier","Nijhuizum","Nijland","Noardburgum","Noordwolde","Oentsjerk","Offingawier","Oldeberkoop","Oldeholtpade","Oldeholtwolde","Oldelamer","Oldeouwer","Oldetrijne","Olterterp","Oosterbierum","Oosterend","Oosterstreek","Oosterwolde","Oosterzee","Oosthem","Opeinde","Oppenhuizen","Oranjewoud","Oudebildtzijl","Oudega","Oudehaske","Oudehorne","Oudemirdum","Oudeschoot","Ouwster-Nijega","Ouwsterhaule","Parrega","Peazens","Peins","Peperga","Piaam","Pietersbierum","Pingjum","Poppenwier","Raard","Raerd","Ravenswoud","Readtsjerk","Reahûs","Reduzum","Reitsum","Ried","Rien","Rijs","Rinsumageast","Rohel","Rotstergaast","Rotsterhaule","Rottevalle","Rottum","Ruigahuizen","Ryptsjerk","Sandfirden","Schalsum","Scharnegoutum","Scharsterbrug","Scherpenzeel","Schettens","Schiermonnikoog","Schraard","Sexbierum","Sibrandabuorren","Sibrandahûs","Siegerswoude","Sint Nicolaasga","Sintjohannesga","Skingen","Slappeterp","Slijkenburg","Sloten","Smalle Ee","Smallebrugge","Snakkerburen","Sneek","Snikzwaag","Sondel","Sonnega","Spanga","Spannum","St.-Annaparochie","St.-Jacobiparochie","Stavoren","Steggerda","Stiens","Striep","Stroobos","Sumar","Surhuisterveen","Surhuizum","Suwâld","Sweagerbosk","Swichum","Teerns","Ter Idzard","Terband","Terherne","Terkaple","Ternaard","Teroele","Tersoal","Terwispel","Tijnje","Tirns","Tjalhuizum","Tjalleberd","Tjerkgaast","Tjerkwerd","Twijzel","Twijzelerheide","Tytsjerk","Tzum","Tzummarum","Uitwellingerga","Ureterp","Vegelinsoord","Vinkega","Vlieland","Vrouwenparochie","Waaksens","Waaxens","Wâlterswâld","Wânswert","Warfstermolen","Warns","Warstiens","Warten","Waskemeer","Weidum","Wergea","West-Terschelling","Westergeast","Westhem","Westhoek","Wetsens","Wier","Wierum","Wijckel","Wijnaldum","Wijnjewoude","Winsum","Wirdum","Witmarsum","Wiuwert","Wjelsryp","Wolsum","Wolvega","Wommels","Wons","Workum","Woudsend","Wyns","Wytgaard","Ypecolsga","Ysbrechtum","Zandhuizen","Zurich","Zweins"],
  "Fryslân": ["Aalsum","Abbega","Achlum","Akkrum","Akmarijp","Alde Leie","Aldeboarn","Aldtsjerk","Aldwâld","Allingawier","Appelscha","Arum","Augsbuert-Lytsewâld","Augustinusga","Baaiduinen","Baaium","Baard","Bakhuizen","Bakkeveen","Balk","Ballum","Bantega","Bears","Beetsterzwaag","Berltsum","Bitgum","Bitgummole","Blauwhuis","Blesdijke","Blessum","Blije","Boarnwert","Boazum","Boelenslaan","Boer","Boijl","Boksum","Bolsward","Bontebok","Boornbergum","Boornzwaag","Brantgum","Breezanddijk","Britsum","Britswert","Broek","Broeksterwâld","Buitenpost","Burdaard","Buren","Burgum","Burgwerd","Burum","Cornwerd","Damwâld","De Blesse","De Falom","De Hoeve","De Knipe","De Tike","De Trieme","De Veenhoop","De Westereen","De Wilgen","Dearsum","Dedgum","Deinum","Delfstrahuizen","Dijken","Dokkum","Dongjum","Doniaga","Donkerbroek","Drachten","Drachten-Azeven","Drachtstercompagnie","Driezum","Drogeham","Dronryp","Eagum","Eanjum","Earnewâld","Easterein","Easterlittens","Eastermar","Easternijtsjerk","Easterwierrum","Eastrum","Echten","Echtenerbrug","Eesterga","Elahuizen","Elsloo","Exmorra","Feankleaster","Feanwâlden","Feinsum","Ferwert","Ferwoude","Firdgum","Fochteloo","Follega","Folsgare","Formerum","Foudgum","Franeker","Friens","Frieschepalen","Gaast","Gaastmeer","Garyp","Gauw","Gerkesklooster","Gersloot","Ginnum","Goënga","Goëngahuizen","Goingarijp","Gorredijk","Goutum","Greonterp","Grou","Gytsjerk","Hallum","Hantum","Hantumerútbuorren","Hantumhuzen","Harich","Harkema","Harlingen","Hartwerd","Haskerdijken","Haskerhorne","Haule","Haulerwijk","Hee","Heeg","Heerenveen","Hegebeintum","Hemelum","Hempens","Hemrik","Herbaijum","Hiaure","Hichtum","Hidaard","Hieslum","Hijum","Hilaard","Hindeloopen","Hinnaard","Hitzum","Hollum","Holwert","Hommerts","Hoorn","Hoornsterzwaag","Houtigehage","Húns","Hurdegaryp","Idaerd","Idsegahuizum","Idskenhuizen","Idzega","Ie","Iens","IJlst","Indijk","Ingelum","Ingwierrum","It Heidenskip","Itens","Jannum","Jellum","Jelsum","Jirnsum","Jislum","Jistrum","Jonkerslân","Jorwert","Joure","Jouswier","Jubbega","Jutrijp","Kaard","Katlijk","Kimswerd","Kinnum","Klooster Lidlum","Koarnjum","Kolderwolde","Kollum","Kollumerpomp","Kollumersweach","Kootstertille","Kornwerderzand","Kortehemmen","Koudum","Koufurderrige","Kûbaard","Landerum","Langedijke","Langelille","Langezwaag","Langweer","Leeuwarden","Legemeer","Lekkum","Lemmer","Leons","Lichtaard","Lies","Lippenhuizen","Ljussens","Loënga","Lollum","Longerhouw","Luinjeberd","Luxwoude","Lytsewierrum","Makkinga","Makkum","Mantgum","Marrum","Marsum","Menaam","Midlum","Midsland","Miedum","Mildam","Minnertsga","Mirns","Mitselwier","Moarre","Moddergat","Molkwerum","Mûnein","Munnekeburen","Munnekezijl","Nes","Nieuwebrug","Nieuwehorne","Nieuweschoot","Nij Altoenae","Nij Beets","Nijeberkoop","Nijega","Nijehaske","Nijeholtpade","Nijeholtwolde","Nijelamer","Nijemirdum","Nijetrijne","Nijewier","Nijhuizum","Nijland","Noardburgum","Noordwolde","Oentsjerk","Offingawier","Oldeberkoop","Oldeholtpade","Oldeholtwolde","Oldelamer","Oldeouwer","Oldetrijne","Olterterp","Oosterbierum","Oosterend","Oosterstreek","Oosterwolde","Oosterzee","Oosthem","Opeinde","Oppenhuizen","Oranjewoud","Oudebildtzijl","Oudega","Oudehaske","Oudehorne","Oudemirdum","Oudeschoot","Ouwster-Nijega","Ouwsterhaule","Parrega","Peazens","Peins","Peperga","Piaam","Pietersbierum","Pingjum","Poppenwier","Raard","Raerd","Ravenswoud","Readtsjerk","Reahûs","Reduzum","Reitsum","Ried","Rien","Rijs","Rinsumageast","Rohel","Rotstergaast","Rotsterhaule","Rottevalle","Rottum","Ruigahuizen","Ryptsjerk","Sandfirden","Schalsum","Scharnegoutum","Scharsterbrug","Scherpenzeel","Schettens","Schiermonnikoog","Schraard","Sexbierum","Sibrandabuorren","Sibrandahûs","Siegerswoude","Sint Nicolaasga","Sintjohannesga","Skingen","Slappeterp","Slijkenburg","Sloten","Smalle Ee","Smallebrugge","Snakkerburen","Sneek","Snikzwaag","Sondel","Sonnega","Spanga","Spannum","St.-Annaparochie","St.-Jacobiparochie","Stavoren","Steggerda","Stiens","Striep","Stroobos","Sumar","Surhuisterveen","Surhuizum","Suwâld","Sweagerbosk","Swichum","Teerns","Ter Idzard","Terband","Terherne","Terkaple","Ternaard","Teroele","Tersoal","Terwispel","Tijnje","Tirns","Tjalhuizum","Tjalleberd","Tjerkgaast","Tjerkwerd","Twijzel","Twijzelerheide","Tytsjerk","Tzum","Tzummarum","Uitwellingerga","Ureterp","Vegelinsoord","Vinkega","Vlieland","Vrouwenparochie","Waaksens","Waaxens","Wâlterswâld","Wânswert","Warfstermolen","Warns","Warstiens","Warten","Waskemeer","Weidum","Wergea","West-Terschelling","Westergeast","Westhem","Westhoek","Wetsens","Wier","Wierum","Wijckel","Wijnaldum","Wijnjewoude","Winsum","Wirdum","Witmarsum","Wiuwert","Wjelsryp","Wolsum","Wolvega","Wommels","Wons","Workum","Woudsend","Wyns","Wytgaard","Ypecolsga","Ysbrechtum","Zandhuizen","Zurich","Zweins"],
  "Gelderland-Midden": ["Achterveld","Aerdt","Andelst","Angeren","Angerlo","Arnhem","Babberich","Barneveld","Bemmel","Bennekom","De Glind","De Klomp","De Steeg","Deelen","Dieren","Doesburg","Doornenburg","Doorwerth","Driel","Duiven","Ede","Ederveen","Ellecom","Elst","Garderen","Gendt","Giesbeek","Groessen","Haalderen","Harskamp","Heelsum","Hemmen","Herveld","Herwen","Heteren","Heveadorp","Hoenderloo","Hoevelaken","Homoet","Huissen","Kootwijk","Kootwijkerbroek","Laag-Soeren","Lathum","Lobith","Loo Gld","Lunteren","Nijkerk","Nijkerkerveen","Oosterbeek","Oosterhout","Otterlo","Pannerden","Randwijk","Renkum","Ressen","Rheden","Rozendaal","Scherpenzeel","Slijk-Ewijk","Spankeren","Spijk","Stroe","Terschuur","Tolkamer","Valburg","Velp","Voorthuizen","Wageningen","Wekerom","Westervoort","Wolfheze","Zetten","Zevenaar","Zwartebroek"],
  "Gelderland-Zuid": ["Aalst","Acquoy","Afferden","Alem","Alphen","Altforst","Ammerzoden","Appeltern","Asch","Asperen","Balgoij","Batenburg","Beek","Beesd","Beneden-Leeuwen","Berg en Dal","Bergharen","Bern","Beuningen Gld","Beusichem","Boven-Leeuwen","Brakel","Bruchem","Buren","Buurmalsen","Culemborg","Deest","Deil","Delwijnen","Dodewaard","Dreumel","Druten","Echteld","Eck en Wiel","Enspijk","Erichem","Erlecom","Est","Ewijk","Gameren","Geldermalsen","Gellicum","Groesbeek","Haaften","Hedel","Heerewaarden","Heesselt","Heilig Landstichting","Hellouw","Hernen","Herwijnen","Heukelum","Heumen","Hoenzadriel","Horssen","Hurwenen","IJzendoorn","Ingen","Kapel Avezaath","Kapel-Avezaath","Kekerdom","Kerk Avezaath","Kerk-Avezaath","Kerkdriel","Kerkwijk","Kesteren","Lent","Leur","Leuth","Lienden","Maasbommel","Malden","Maurik","Meteren","Millingen aan de Rijn","Nederasselt","Nederhemert","Neerijnen","Nieuwaal","Niftrik","Nijmegen","Ochten","Ommeren","Ooij","Ophemert","Opheusden","Opijnen","Overasselt","Persingen","Poederoijen","Puiflijk","Ravenswaaij","Rhenoy","Rijswijk (GLD)","Rossum","Rumpt","Spijk","Tiel","Tricht","Tuil","Ubbergen","Varik","Velddriel","Vuren","Waardenburg","Wadenoijen","Wamel","Well","Weurt","Wijchen","Winssen","Zaltbommel","Zennewijnen","Zoelen","Zoelmond","Zuilichem"],
  "Gooi en Vechtstreek": ["'s-Graveland","Ankeveen","Blaricum","Breukeleveen","Bussum","Hilversum","Huizen","Kortenhoef","Laren","Loosdrecht","Muiden","Muiderberg","Naarden","Nederhorst den Berg"],
  "Groningen": ["'t Waar","'t Zandt","Adorp","Aduard","Alteveer","Appingedam","Bad Nieuweschans","Baflo","Bedum","Beerta","Bellingwolde","Bierum","Blauwestad","Blijham","Boerakker","Borgercompagnie","Borgsweer","Bourtange","Briltil","De Wilp","Delfzijl","Den Andel","Den Ham","Den Horn","Doezum","Drieborg","Eemshaven","Eenrum","Eenum","Enumatil","Eppenhuizen","Ezinge","Farmsum","Feerwerd","Finsterwolde","Foxhol","Froombosch","Garmerwolde","Garnwerd","Garrelsweer","Garsthuizen","Glimmen","Godlinze","Grijpskerk","Groningen","Grootegast","Haren Gn","Harkstede","Harkstede GN","Heiligerlee","Hellum","Holwierde","Hoogezand","Hornhuizen","Houwerzijl","Huizinge","Jonkersvaart","Kantens","Kiel-Windeweer","Kloosterburen","Kolham","Kommerzijl","Kornhorn","Krewerd","Kropswolde","Lageland","Lageland GN","Lauwersoog","Lauwerzijl","Leek","Leens","Leermens","Lellens","Lettelbert","Loppersum","Losdorp","Lucaswolde","Luddeweer","Lutjegast","Marum","Meeden","Meedhuizen","Meerstad","Mensingeweer","Middelstum","Midwolda","Midwolde","Muntendam","Mussel","Musselkanaal","Niebert","Niehove","Niekerk","Nieuw Beerta","Nieuw Scheemda","Nieuwe Pekela","Nieuwolda","Niezijl","Noordbroek","Noordhorn","Noordlaren","Noordwijk","Noordwolde","Nuis","Oldehove","Oldekerk","Oldenzijl","Onderdendam","Onnen","Onstwedde","Oosternieland","Oosterwijtwerd","Oostwold","Opende","Oude Pekela","Oudeschans","Oudeschip","Oudezijl","Overschild","Pieterburen","Pieterzijl","Rasquert","Roodeschool","Rottum","Saaksum","Saaxumhuizen","Sappemeer","Sauwerd","Scharmer","Scheemda","Schildwolde","Schouwerzijl","Sebaldeburen","Sellingen","Siddeburen","Sint Annen","Slochteren","Spijk","Stadskanaal","Startenhuizen","Stedum","Steendam","Stitswerd","Ten Boer","Ten Post","Ter Apel","Ter Apelkanaal","Termunten","Termunterzijl","Thesinge","Tinallinge","Tjuchem","Tolbert","Toornwerd","Tripscompagnie","Uithuizen","Uithuizermeeden","Ulrum","Usquert","Veelerveen","Veendam","Vierhuizen","Visvliet","Vlagtwedde","Vledderveen","Vriescheloo","Wagenborgen","Warffum","Warfhuizen","Waterhuizen","Wedde","Wehe-den Hoorn","Westerbroek","Westeremden","Westerlee","Westernieland","Westerwijtwerd","Wetsinge","Wildervank","Winneweer","Winschoten","Winsum","Wirdum","Woldendorp","Woltersum","Woudbloem","Zandeweer","Zeerijp","Zevenhuizen","Zijldijk","Zoutkamp","Zuidbroek","Zuidhorn","Zuidwolde","Zuurdijk"],
  "Haaglanden": ["'s-Gravenzande","De Lier","Delfgauw","Delft","Den Haag","Den Hoorn","Honselersdijk","Kwintsheul","Leidschendam","Maasdijk","Maasland","Monster","Naaldwijk","Nootdorp","Pijnacker","Poeldijk","Rijswijk","Schipluiden","Ter Heijde","Voorburg","Wassenaar","Wateringen","Zoetermeer"],
  "Hollands Midden": ["Aarlanderveen","Alphen aan den Rijn","Ammerstol","Benthuizen","Bergambacht","Berkenwoude","Bodegraven","Boskoop","De Zilk","Driebruggen","Gelderswoude","Gouda","Gouderak","Haastrecht","Hazerswoude-Dorp","Hazerswoude-Rijndijk","Hillegom","Hoogmade","Kaag","Katwijk","Koudekerk aan den Rijn","Krimpen aan de Lek","Leiden","Leiderdorp","Leimuiden","Lekkerkerk","Lisse","Moerkapelle","Moordrecht","Nieuwe Wetering","Nieuwerbrug aan den Rijn","Nieuwerkerk aan den IJssel","Nieuwkoop","Nieuwveen","Noorden","Noordwijk","Noordwijkerhout","Oegstgeest","Oud Ade","Oude Wetering","Ouderkerk aan den IJssel","Reeuwijk","Rijnsaterwoude","Rijnsburg","Rijpwetering","Roelofarendsveen","Sassenheim","Schoonhoven","Stolwijk","Ter Aar","Valkenburg","Vlist","Voorhout","Voorschoten","Vrouwenakker","Waarder","Waddinxveen","Warmond","Woerdense Verlaat","Woubrugge","Zevenhoven","Zevenhuizen","Zoeterwoude","Zwammerdam"],
  "IJsselland": ["'s-Heerenbroek","Ane","Anerveen","Anevelde","Arriën","Baarlo","Baars","Balkbrug","Basse","Bathmen","Beerze","Beerzerveld","Belt-Schutsloot","Bergentheim","Blankenham","Blokzijl","Broekland","Brucht","Bruchterveld","Collendoorn","Colmschate","Dalfsen","Dalmsholte","De Bult","De Krim","De Pol","Dedemsvaart","Den Velde","Deventer","Diepenveen","Diffelen","Eesveen","Genemuiden","Giethmen","Giethoorn","Grafhorst","Gramsbergen","Hardenberg","Hasselt","Heemserveen","Heeten","Heino","Holtheme","Holthone","Hoogenweg","IJhorst","IJsselham","IJsselmuiden","Kalenberg","Kallenkote","Kampen","Kamperveen","Kloosterhaar","Kuinre","Laag Zuthem","Lemele","Lemelerveld","Lettele","Lierderholthuis","Loozen","Lutten","Luttenberg","Mariënberg","Mariënheem","Marijenkampen","Marle","Mastenbroek","Nederland","Nieuw Heeten","Nieuwleusen","Okkenbroek","Oldemarkt","Olst","Ommen","Onna","Ossenzijl","Paasloo","Punthorst","Raalte","Radewijk","Reeve","Rheeze","Rheezerveen","Rouveen","Schalkhaar","Scheerwolde","Schuinesloot","Sibculo","Sint Jansklooster","Slagharen","Staphorst","Steenwijk","Steenwijkerwold","Stegeren","Tuk","Venebrugge","Vilsteren","Vinkenbuurt","Vollenhove","Wanneperveen","Welsum","Wesepe","Wetering","Wijhe","Willemsoord","Wilsum","Witharen","Witte Paarden","Zalk","Zuidveen","Zwartsluis","Zwolle"],
  "Kennemerland": ["Aalsmeerderbrug","Abbenes","Aerdenhout","Badhoevedorp","Beinsdorp","Bennebroek","Bentveld","Beverwijk","Bloemendaal","Boesingheliede","Buitenkaag","Burgerveen","Cruquius","Driehuis NH","Haarlem","Haarlemmerliede","Halfweg","Heemskerk","Heemstede","Hoofddorp","IJmuiden","Leimuiderbrug","Lijnden","Lisserbroek","Nieuw-Vennep","Oude Meer","Overveen","Rijsenhout","Rozenburg","Santpoort-Noord","Santpoort-Zuid","Schiphol","Schiphol-Rijk","Spaarndam","Spaarndam gem. Haarlem","Uitgeest","Velsen-Noord","Velsen-Zuid","Velserbroek","Vijfhuizen","Vogelenzang","Weteringbrug","Wijk aan Zee","Zandvoort","Zwaanshoek","Zwanenburg"],
  "Limburg-Noord": ["Afferden L","America","Arcen","Baarlo","Baexem","Beegden","Beesel","Belfeld","Bergen L","Beringe","Blitterswijck","Broekhuizen","Broekhuizenvorst","Buggenum","Castenray","Echt","Egchel","Ell","Evertsoord","Geijsteren","Gennep","Grashoek","Grathem","Griendtsveen","Grubbenvorst","Haelen","Haler","Heel","Hegelsom","Heibloem","Heide","Heijen","Helden","Herkenbosch","Herten","Heythuysen","Horn","Horst","Hunsel","Ittervoort","Kelpen-Oler","Kessel","Koningsbosch","Koningslust","Kronenberg","Leunen","Leveroy","Linne","Lomm","Lottum","Maasbracht","Maasbree","Maria Hoop","Meerlo","Meijel","Melderslo","Melick","Merselo","Meterik","Middelaar","Milsbeek","Molenhoek","Montfort","Mook","Nederweert","Nederweert-Eind","Neer","Neeritter","Nieuwstadt","Nunhem","Ohé en Laak","Oirlo","Oostrum","Ospel","Ottersum","Panningen","Plasmolen","Posterholt","Reuver","Roermond","Roggel","Roosteren","Sevenum","Siebengewald","Sint Joost","Sint Odiliënberg","Smakt","Stevensweert","Steyl","Stramproy","Susteren","Swalmen","Swolgen","Tegelen","Thorn","Tienray","Velden","Ven-Zelderheide","Venlo","Venray","Veulen","Vlodrop","Vredepeel","Wanssum","Weert","Well L","Wellerlooi","Wessem","Ysselsteyn"],
  "Limburg-Zuid": ["Amstenrade","Baneheide","Banholt","Beek","Bemelen","Berg en Terblijt","Beutenaken","Bingelrade","Bocholtz","Born","Brunssum","Buchten","Bunde","Cadier en Keer","Doenrade","Eckelrade","Eijsden","Einighausen","Elkenrade","Elsloo","Epen","Eygelshoven","Eys","Geleen","Geulle","Grevenbicht","Gronsveld","Gulpen","Guttecoven","Heerlen","Heijenrath","Hoensbroek","Holtum","Hulsberg","Ingber","Jabeek","Kerkrade","Klimmen","Landgraaf","Lemiers","Limbricht","Maastricht","Maastricht-Airport","Margraten","Mechelen","Meerssen","Merkelbeek","Mheer","Moorveld","Munstergeleen","Noorbeek","Nuth","Obbicht","Oirsbeek","Papenhoven","Puth","Ransdaal","Reijmerstok","Scheulder","Schimmert","Schin op Geul","Schinnen","Schinveld","Simpelveld","Sint Geertruid","Sittard","Slenaken","Spaubeek","Stein","Sweikhuizen","Ulestraten","Urmond","Vaals","Valkenburg","Vijlen","Voerendaal","Walem","Wijlre","Wijnandsrade","Windraak","Wittem"],
  "Zuid-Limburg": ["Amstenrade","Baneheide","Banholt","Beek","Bemelen","Berg en Terblijt","Beutenaken","Bingelrade","Bocholtz","Born","Brunssum","Buchten","Bunde","Cadier en Keer","Doenrade","Eckelrade","Eijsden","Einighausen","Elkenrade","Elsloo","Epen","Eygelshoven","Eys","Geleen","Geulle","Grevenbicht","Gronsveld","Gulpen","Guttecoven","Heerlen","Heijenrath","Hoensbroek","Holtum","Hulsberg","Ingber","Jabeek","Kerkrade","Klimmen","Landgraaf","Lemiers","Limbricht","Maastricht","Maastricht-Airport","Margraten","Mechelen","Meerssen","Merkelbeek","Mheer","Moorveld","Munstergeleen","Noorbeek","Nuth","Obbicht","Oirsbeek","Papenhoven","Puth","Ransdaal","Reijmerstok","Scheulder","Schimmert","Schin op Geul","Schinnen","Schinveld","Simpelveld","Sint Geertruid","Sittard","Slenaken","Spaubeek","Stein","Sweikhuizen","Ulestraten","Urmond","Vaals","Valkenburg","Vijlen","Voerendaal","Walem","Wijlre","Wijnandsrade","Windraak","Wittem"],
  "Midden- en West Brabant": ["'s Gravenmoer","Achtmaal","Almkerk","Alphen","Andel","Baarle-Nassau","Babyloniënbroek","Bavel","Bavel AC","Bergen op Zoom","Berkel-Enschot","Biest-Houtakker","Biezenmortel","Bosschenhoofd","Breda","Castelre","Chaam","De Heen","De Moer","Den Hout","Diessen","Dinteloord","Dongen","Dorst","Drimmelen","Drongelen","Dussen","Eethen","Esbeek","Etten-Leur","Fijnaart","Galder","Geertruidenberg","Genderen","Giessen","Gilze","Goirle","Haaren","Haghorst","Halsteren","Hank","Heerle","Heijningen","Heukelom","Hilvarenbeek","Hoeven","Hooge Zwaluwe","Hoogerheide","Huijbergen","Hulten","Kaatsheuvel","Klein Zundert","Klundert","Kruisland","Lage Zwaluwe","Langeweg","Lepelstraat","Loon op Zand","Made","Meeuwen","Moerdijk","Moergestel","Moerstraten","Molenschot","Nieuw-Vossemeer","Nieuwendijk","Nispen","Noordhoek","Oisterwijk","Oosteind","Oosterhout","Ossendrecht","Oud Gastel","Oudemolen","Oudenbosch","Prinsenbeek","Putte","Raamsdonk","Raamsdonksveer","Riel","Rijen","Rijsbergen","Rijswijk (NB)","Roosendaal","Rucphen","Schijf","Sleeuwijk","Sprang-Capelle","Sprundel","St. Willebrord","Stampersgat","Standdaarbuiten","Steenbergen","Strijbeek","Terheijden","Teteringen","Tilburg","Udenhout","Uitwijk","Ulicoten","Ulvenhout","Ulvenhout AC","Veen","Waalwijk","Waardhuizen","Wagenberg","Waspik","Werkendam","Wernhout","Wijk en Aalburg","Willemstad","Woensdrecht","Woudrichem","Wouw","Wouwse Plantage","Zegge","Zevenbergen","Zevenbergschen Hoek","Zundert"],
  "Noord- en Oost Gelderland": ["'s-Heerenberg","'t Harde","'t Loo Oldebroek","Aalten","Almen","Apeldoorn","Azewijn","Baak","Barchem","Beek","Beekbergen","Beemte Broekland","Beltrum","Borculo","Braamt","Bredevoort","Breedenbroek","Bronkhorst","Brummen","De Heurne","Didam","Dinxperlo","Doetinchem","Doornspijk","Drempt","Eefde","Eerbeek","Eibergen","Elburg","Elspeet","Empe","Emst","Epe","Epse","Ermelo","Etten","Gaanderen","Geesteren","Gelselaar","Gendringen","Gorssel","Groenlo","Haarlo","Hall","Halle","Harderwijk","Harfsen","Harreveld","Hattem","Hattemerbroek","Heelweg","Heerde","Hengelo (Gld)","Hierden","Hoenderloo","Hoog Soeren","Hoog-Keppel","Hulshorst","Hummelo","Joppe","Keijenborg","Kilder","Klarenbeek","Kring van Dorth","Laag-Keppel","Laren","Lengel","Leuvenheim","Lichtenvoorde","Lieren","Lievelde","Lochem","Loenen","Loerbeek","Mariënvelde","Megchelen","Neede","Netterden","Nijbroek","Noordeinde Gld","Nunspeet","Oene","Olburgen","Oldebroek","Oosterwolde Gld","Putten","Radio Kootwijk","Rekken","Rha","Rietmolen","Ruurlo","Silvolde","Sinderen","Steenderen","Steenenkamer","Stokkum","Terborg","Terwolde","Teuge","Toldijk","Tonden","Twello","Uddel","Ugchelen","Ulft","Vaassen","Varsselder","Varsseveld","Veessen","Vethuizen","Vierakker","Vierhouten","Voorst","Vorchten","Vorden","Vragender","Wapenveld","Warnsveld","Wehl","Wenum Wiesel","Westendorp","Wezep","Wichmond","Wijnbergen","Wilp","Winterswijk","Winterswijk Brinkheurne","Winterswijk Corle","Winterswijk Henxel","Winterswijk Huppel","Winterswijk Kotten","Winterswijk Meddo","Winterswijk Miste","Winterswijk Ratum","Winterswijk Woold","Zeddam","Zelhem","Zieuwent","Zutphen"],
  "Noord-Holland-Noord": ["'t Veld","'t Zand","Aartswoud","Abbekerk","Akersloot","Alkmaar","Andijk","Anna Paulowna","Avenhorn","Barsingerhorn","Benningbroek","Bergen (NH)","Bergen aan Zee","Berkhout","Blokker","Bovenkarspel","Breezand","Broek op Langedijk","Burgerbrug","Callantsoog","Castricum","De Cocksdorp","De Goorn","De Koog","De Rijp","De Waal","De Weere","de Woude","Den Burg","Den Helder","Den Hoorn","Den Oever","Dirkshorn","Driehuizen","Egmond aan den Hoef","Egmond aan Zee","Egmond-Binnen","Enkhuizen","Graft","Groet","Grootebroek","Grootschermer","Haringhuizen","Hauwert","Heerhugowaard","Heiloo","Hem","Hensbroek","Hippolytushoef","Hoogkarspel","Hoogwoud","Hoorn","Huisduinen","Julianadorp","Koedijk","Kolhorn","Kreileroord","Lambertschaag","Limmen","Lutjebroek","Lutjewinkel","Markenbinnen","Medemblik","Middenmeer","Midwoud","Nibbixwoud","Nieuwe Niedorp","Noord-Scharwoude","Noordeinde","Obdam","Oost-Graftdijk","Oosterblokker","Oosterend","Oosterleek","Oostwoud","Opmeer","Opperdoes","Oterleek","Oude Niedorp","Oudendijk","Oudeschild","Oudesluis","Oudkarspel","Oudorp","Petten","Schagen","Schagerbrug","Scharwoude","Schellinkhout","Schermerhorn","Schoorl","Sijbekarspel","Sint Maarten","Sint Maartensbrug","Sint Maartensvlotbrug","Sint Pancras","Slootdorp","Spanbroek","Spierdijk","Starnmeer","Stompetoren","Tuitjenhorn","Twisk","Ursem","Venhuizen","Waarland","Warmenhuizen","Wervershoof","West-Graftdijk","Westerland","Westwoud","Wieringerwaard","Wieringerwerf","Wijdenes","Winkel","Wognum","Zijdewind","Zuid-Scharwoude","Zuidermeer","Zuidschermer","Zwaag","Zwaagdijk-Oost","Zwaagdijk-West"],
  "Rotterdam-Rijnmond": ["Abbenbroek","Achthuizen","Barendrecht","Bergschenhoek","Berkel en Rodenrijs","Bleiswijk","Botlek Rotterdam","Brielle","Capelle aan den IJssel","Den Bommel","Dirksland","Europoort Rotterdam","Geervliet","Goedereede","Heenvliet","Hekelingen","Hellevoetsluis","Herkingen","Hoek van Holland","Hoogvliet Rotterdam","Krimpen aan den IJssel","Maassluis","Maasvlakte Rotterdam","Melissant","Middelharnis","Nieuwe-Tonge","Ooltgensplaat","Oostvoorne","Ouddorp","Oude-Tonge","Oudenhoorn","Pernis Rotterdam","Poortugaal","Rhoon","Ridderkerk","Rockanje","Rotterdam","Rotterdam-Albrandswaard","Rozenburg","Schiedam","Simonshaven","Sommelsdijk","Spijkenisse","Stad aan 't Haringvliet","Stellendam","Tinte","Vierpolders","Vlaardingen","Vondelingenplaat Rotterdam","Zuidland","Zwartewaal"],
  "Twente": ["Aadorp","Agelo","Albergen","Almelo","Ambt Delden","Bentelo","Beuningen","Borne","Bornerbroek","Bruinehaar","Daarle","Daarlerveen","de Lutte","Delden","Den Ham","Denekamp","Deurningen","Diepenheim","Enschede","Enter","Fleringen","Geerdijk","Geesteren","Glane","Goor","Haaksbergen","Haarle","Harbrinkhoek","Hellendoorn","Hengelo","Hengevelde","Hertme","Hezingen","Hoge Hexel","Holten","Kloosterhaar","Langeveen","Lattrop-Breklenkamp","Losser","Mander","Manderveen","Mariaparochie","Markelo","Nijverdal","Notter","Nutter","Oldenzaal","Ootmarsum","Oud Ootmarsum","Overdinkel","Reutum","Rijssen","Rossum","Saasveld","Sibculo","Tilligte","Tubbergen","Vasse","Vriezenveen","Vroomshoop","Weerselo","Westerhaar-Vriezenveensewijk","Wierden","Zenderen","Zuna"],
  "Utrecht": ["'t Goy","Abcoude","Achterveld","Ameide","Amerongen","Amersfoort","Amstelhoek","Austerlitz","Baambrugge","Baarn","Benschop","Bilthoven","Bosch en Duin","Breukelen","Bunnik","Bunschoten-Spakenburg","Cothen","De Bilt","de Hoef","De Meern","Den Dolder","Doorn","Driebergen-Rijsenburg","Eemdijk","Eemnes","Elst Ut","Everdingen","Groenekan","Haarzuilens","Hagestein","Harmelen","Hei- en Boeicop","Hekendorp","Hoef en Haag","Hollandsche Rading","Hoogland","Hooglanderveen","Houten","Huis ter Heide","IJsselstein","Jaarsveld","Kamerik","Kedichem","Kockengen","Lage Vuursche","Langbroek","Leerbroek","Leerdam","Leersum","Leusden","Lexmond","Linschoten","Loenen aan de Vecht","Loenersloot","Lopik","Lopikerkapel","Maarn","Maarsbergen","Maarssen","Maartensdijk","Meerkerk","Mijdrecht","Montfoort","Nieuwegein","Nieuwer Ter Aa","Nieuwersluis","Nieuwland","Nigtevecht","Odijk","Oosterwijk","Ossenwaard","Oud Zuilen","Oudewater","Overberg","Papekop","Polsbroek","Renswoude","Rhenen","Schalkwijk","Schoonrewoerd","Snelrewaard","Soest","Soesterberg","Stoutenburg","Stoutenburg Noord","Tienhoven","Tienhoven aan de Lek","Tull en 't Waal","Utrecht","Veenendaal","Vianen","Vinkeveen","Vleuten","Vreeland","Waverveen","Werkhoven","Westbroek","Wijk bij Duurstede","Wilnis","Woerden","Woudenberg","Zegveld","Zeist","Zijderveld"],
  "Zaanstreek-Waterland": ["Assendelft","Beets","Broek in Waterland","Den Ilp","Edam","Hobrede","Ilpendam","Jisp","Katwoude","Koog aan de Zaan","Krommenie","Kwadijk","Landsmeer","Marken","Middelie","Middenbeemster","Monnickendam","Noordbeemster","Oosthuizen","Oostknollendam","Oostzaan","Purmer","Purmerend","Purmerland","Schardam","Spijkerboor","Uitdam","Volendam","Warder","Watergang","Westbeemster","Westknollendam","Westzaan","Wijdewormer","Wormer","Wormerveer","Zaandam","Zaandijk","Zuiderwoude","Zuidoostbeemster"],
  "Zeeland": ["'s-Gravenpolder","'s-Heer Abtskerke","'s-Heer Arendskerke","'s-Heer Hendrikskinderen","'s-Heerenhoek","Aagtekerke","Aardenburg","Arnemuiden","Axel","Baarland","Biervliet","Biggekerke","Borssele","Breskens","Brouwershaven","Bruinisse","Burgh-Haamstede","Cadzand","Clinge","Colijnsplaat","Domburg","Dreischor","Driewegen","Eede","Ellemeet","Ellewoutsdijk","Gapinge","Geersdijk","Goes","Graauw","Grijpskerke","Groede","Hansweert","Heikant","Heinkenszand","Hengstdijk","Hoedekenskerke","Hoek","Hoofdplaat","Hulst","IJzendijke","Kamperland","Kapelle","Kapellebrug","Kats","Kattendijke","Kerkwerve","Kloetinge","Kloosterzande","Koewacht","Kortgene","Koudekerke","Krabbendijke","Kruiningen","Kuitaart","Kwadendamme","Lamswaarde","Lewedorp","Meliskerke","Middelburg","Nieuw Namen","Nieuw- en Sint Joosland","Nieuwdorp","Nieuwerkerk","Nieuwvliet","Nisse","Noordgouwe","Noordwelle","Oost-Souburg","Oostburg","Oostdijk","Oosterland","Oostkapelle","Ossenisse","Oud-Vossemeer","Oudelande","Ouwerkerk","Overslag","Ovezande","Philippine","Poortvliet","Renesse","Retranchement","Rilland","Ritthem","Sas van Gent","Scharendijke","Scherpenisse","Schoondijke","Schore","Serooskerke","Sint Jansteen","Sint Kruis","Sint Philipsland","Sint-Annaland","Sint-Maartensdijk","Sirjansland","Sluis","Sluiskil","Spui","Stavenisse","Terhole","Terneuzen","Tholen","Veere","Vlissingen","Vogelwaarde","Vrouwenpolder","Waarde","Walsoorden","Waterlandkerkje","Wemeldinge","Westdorpe","Westkapelle","Wilhelminadorp","Wissenkerke","Wolphaartsdijk","Yerseke","Zaamslag","Zierikzee","Zonnemaire","Zoutelande","Zuiddorpe","Zuidzande"],
  "Zuid-Holland-Zuid": ["'s-Gravendeel","Alblasserdam","Arkel","Bleskensgraaf ca","Brandwijk","Dalem","Dordrecht","Giessenburg","Gorinchem","Goudriaan","Goudswaard","Groot-Ammers","Hardinxveld-Giessendam","Heerjansdam","Heinenoord","Hendrik-Ido-Ambacht","Hoogblokland","Hoornaar","Kinderdijk","Klaaswaal","Langerak","Maasdam","Mijnsheerenland","Molenaarsgraaf","Mookhoek","Nieuw-Beijerland","Nieuw-Lekkerland","Nieuwpoort","Noordeloos","Numansdorp","Ottoland","Oud-Alblas","Oud-Beijerland","Papendrecht","Piershil","Puttershoek","Schelluinen","Sliedrecht","Streefkerk","Strijen","Strijensas","Waal","Westmaas","Wijngaarden","Zuid-Beijerland","Zwijndrecht"],
}

// Known P2000 CAD abbreviations per municipality.
// When filtering for e.g. "Den Haag", messages containing "SGRAVH" also match.
const CITY_ALIASES = {
  "Den Haag":           ["SGRAVH","S-GRAVENHAGE","Gravenhage"],
  "'s-Hertogenbosch":   ["DEN BOSCH","Den Bosch","S-HERTOGENBOSCH","HERTOGENBOSCH"],
  "Rotterdam":          ["RTTDM"],
  "Amsterdam":          ["ADAM","A'DAM"],
  "Schiedam":           ["SCHIDM"],
  "Waddinxveen":        ["WADDXV"],
  "Leeuwarden":         ["LWD"],
}

// Lookup places for a region name (case-insensitive fallback).
function getPlaces(region) {
  if (!region) return []
  if (PLACES[region]) return [...PLACES[region]].sort()
  const key = Object.keys(PLACES).find(k => k.toLowerCase() === region.toLowerCase())
  return key ? [...PLACES[key]].sort() : []
}

// Word-boundary-aware check: does the alert message mention this place?
// Uses lookbehind/lookahead so special chars in names (apostrophes, hyphens) work.
function cityMatchesAlert(city, message) {
  const terms = [city, ...(CITY_ALIASES[city] || [])]
  return terms.some(term => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`(?<![\\w])${escaped}(?![\\w])`, 'i').test(message)
  })
}

// Lowercase set of all known place names — used to stop the backwards prefix walk.
const PLACE_NAMES_LOWER = new Set([
  ...Object.values(PLACES).flat(),
  ...Object.keys(CITY_ALIASES),
  ...Object.values(CITY_ALIASES).flat(),
].map(n => n.toLowerCase()))

// Articles that *begin* a street name ("de Ruyterstraat").
// When encountered walking backwards, include the article and STOP — never look
// further back, so description words like "Letsel" before the article are not captured.
const DUTCH_ARTICLE = new Set(['de', 'het', "'t"])
// Connectors that appear *between* a proper name and the suffix ("Rogier van der Weijdenstraat").
// When encountered, include and keep walking back to find the proper-name word.
const DUTCH_CONNECTOR = new Set(['van', 'den', 'der', 'ter', 'ten'])

// Core: suffix-ending word + house number (\b rejects postal codes like "3067DD").
const STREET_CORE_RE = /\b\w+(?:straat|laan|weg|plein|kade|gracht|singel|boulevard|dijk|pad|hof|dreef|allee|steeg|markt|ring|baan|dam|poort|haven|veld)\b(?:\s+\d{1,5}[a-zA-Z]?\b)?/i

// Descriptive suffixes that mark a word as a service/medical term, not a street-name part.
const DESC_ENDS = ['ologie', 'atie', 'ering', 'heid', 'teit', 'iteit']

// True when a word looks like a proper-name part of a street:
// all-alpha (rejects call codes like "B2"), no descriptive suffix (rejects "Neurologie").
function looksLikeStreetPrefix(word) {
  if (!/^[A-Za-zÀ-ÿ]+$/.test(word)) return false
  const lower = word.toLowerCase()
  return !DESC_ENDS.some(s => lower.endsWith(s))
}

// Find the street name in one slash-delimited segment.
// Returns { streetText, coreEnd } — coreEnd is used by the caller for intersection detection.
//
// Backward walk rules (right-to-left over the words before the core match):
//   DUTCH_ARTICLE   → include + stop   ("de" in "de Ruyterstraat": stop, skip "Letsel")
//   DUTCH_CONNECTOR → include + continue ("van der" in "Rogier van der Weijdenstraat")
//   Capital proper name (all-alpha, no desc suffix) → include + stop after 1 such word
//   Place name / call code / descriptive word → stop without including
// After the loop: also pull in a connector sitting directly before the collected name word
// (handles "Van" in "Van Limburg Styrumstraat").
function findStreetInSegment(segment) {
  const m = STREET_CORE_RE.exec(segment)
  if (!m) return null

  const coreEnd = m.index + m[0].length
  const before = segment.slice(0, m.index).trimEnd()
  const words = before ? before.split(/\s+/) : []
  const prefix = []
  let nonPrepCount = 0
  let stopIdx = -1
  let articleCollected = false

  for (let i = words.length - 1; i >= 0; i--) {
    const w = words[i]
    if (!w) continue
    const lower = w.toLowerCase()
    if (PLACE_NAMES_LOWER.has(lower)) break
    if (DUTCH_ARTICLE.has(lower)) { prefix.unshift(w); articleCollected = true; break }
    if (DUTCH_CONNECTOR.has(lower)) { prefix.unshift(w); continue }
    if (!/^[A-ZÀ-Ö]/.test(w) || !looksLikeStreetPrefix(w)) break
    prefix.unshift(w)
    nonPrepCount++
    stopIdx = i
    if (nonPrepCount >= 1) break
  }

  // Pull in a connector directly before the collected proper-name word.
  if (stopIdx > 0 && nonPrepCount > 0) {
    const prev = words[stopIdx - 1]
    if (prev && DUTCH_CONNECTOR.has(prev.toLowerCase())) prefix.unshift(prev)
  }

  // Discard if only connectors collected — no article and no proper name.
  if (nonPrepCount === 0 && !articleCollected) prefix.length = 0

  const streetText = (prefix.length ? prefix.join(' ') + ' ' : '') + m[0].trim()
  return { streetText, coreEnd }
}

// Fallback: find the first known place in the message (canonical name, not alias).
// Used when no slash-separated city segment follows the street segment.
const ALL_PLACES = [...new Set(Object.values(PLACES).flat())]
function extractCityFromMessage(message) {
  for (const city of ALL_PLACES) {
    const terms = [city, ...(CITY_ALIASES[city] || [])]
    const found = terms.some(term => {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      return new RegExp(`(?<![\\w])${escaped}(?![\\w])`, 'i').test(message)
    })
    if (found) return city
  }
  return null
}

// Wrap the first detected street name in a Google Maps search link.
// Splits on '/' to isolate street segments; uses the following segment as city.
// Intersection detection: if a second street suffix appears within 25 chars after the first,
// the Maps query uses "street1 & street2" — matching Dutch P2000 corner/hoek addresses.
function renderMessage(message) {
  const segments = message.split('/')
  let streetText = null
  let city = null
  let coreEnd = 0
  let activeSegment = null

  for (let i = 0; i < segments.length; i++) {
    const result = findStreetInSegment(segments[i])
    if (!result) continue
    streetText = result.streetText
    coreEnd = result.coreEnd
    activeSegment = segments[i]
    if (i + 1 < segments.length) {
      const candidate = segments[i + 1].trim()
      if (candidate.length >= 2 && candidate.length <= 60) city = candidate
    }
    break
  }

  if (!streetText) return message
  if (!city) city = extractCityFromMessage(message)

  // Detect intersection: second street suffix within 25 chars after the first.
  let locationQuery = streetText
  if (activeSegment) {
    const afterFirst = activeSegment.slice(coreEnd)
    const m2 = STREET_CORE_RE.exec(afterFirst)
    if (m2 && m2.index <= 25) locationQuery = `${streetText} & ${m2[0].trim()}`
  }

  const query = city ? `${locationQuery}, ${city}, Nederland` : `${locationQuery}, Nederland`
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
  const idx = message.indexOf(streetText)
  if (idx === -1) return message

  return (
    <>
      {message.slice(0, idx)}
      <a href={url} target="_blank" rel="noopener noreferrer" className="street-link">
        {streetText}
      </a>
      {message.slice(idx + streetText.length)}
    </>
  )
}

const IS_DEV = import.meta.env.DEV
const WS_URL = IS_DEV
  ? 'ws://127.0.0.1:8000/api/ws'
  : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/api/ws`
const API_BASE = IS_DEV ? 'http://127.0.0.1:8000' : ''
const STORAGE_KEY = 'p2000_alerts'
const MAX_ALERTS = 50

const INTERVAL_OPTIONS = [
  { label: '30s', seconds: 30 },
  { label: '1m', seconds: 60 },
  { label: '2m', seconds: 120 },
  { label: '5m', seconds: 300 },
  { label: '10m', seconds: 600 },
  { label: '20m', seconds: 1200 },
  { label: '30m', seconds: 1800 },
  { label: '45m', seconds: 2700 },
  { label: '60m', seconds: 3600 },
]

const SERVICE_COLORS = {
  Brandweer: 'var(--service-brandweer)',
  Ambulance: 'var(--service-ambulance)',
  Politie: 'var(--service-politie)',
}

function getColor(service) {
  return SERVICE_COLORS[service] || 'var(--service-default)'
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from(raw, c => c.charCodeAt(0))
}

function loadStored() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

async function setupPushSubscription() {
  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    const { publicKey } = await fetch(`${API_BASE}/api/vapid-public-key`).then(r => r.json())
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
    }
    await fetch(`${API_BASE}/api/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub.toJSON()),
    })
  } catch (e) {
    console.error('Push setup failed:', e)
  }
}

export default function App() {
  const [alerts, setAlerts] = useState(loadStored)
  const [connected, setConnected] = useState(false)
  const [interval, setIntervalVal] = useState(30)
  const [notifState, setNotifState] = useState(() => {
    if (!('Notification' in window)) return 'unsupported'
    return Notification.permission // 'default' | 'granted' | 'denied'
  })
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const wsRef = useRef(null)
  const delayRef = useRef(1000)
  const timerRef = useRef(null)

  // Regions seen in live alerts (dynamic — shows only what's been received)
  const regions = useMemo(() => {
    const r = new Set()
    alerts.forEach(a => { if (a.region) r.add(a.region) })
    return [...r].sort()
  }, [alerts])

  // Places for the selected region come from the static list
  const placesForRegion = useMemo(() => getPlaces(selectedRegion), [selectedRegion])

  // Filter only when the typed value exactly matches a known option
  const filteredAlerts = useMemo(() => {
    const regionActive = selectedRegion && regions.includes(selectedRegion)
    const cityActive = selectedCity && placesForRegion.includes(selectedCity)
    if (!regionActive && !cityActive) return alerts
    return alerts.filter(a => {
      if (regionActive && a.region !== selectedRegion) return false
      if (cityActive && !cityMatchesAlert(selectedCity, a.message)) return false
      return true
    })
  }, [alerts, selectedRegion, selectedCity, regions, placesForRegion])

  const persist = useCallback((list) => {
    setAlerts(list)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  }, [])

  const connect = useCallback(() => {
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      delayRef.current = 1000
    }

    ws.onmessage = ({ data }) => {
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed)) {
        persist([...parsed].reverse())
      } else {
        setAlerts(prev => {
          const next = [parsed, ...prev].slice(0, MAX_ALERTS)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
          return next
        })
      }
    }

    ws.onclose = () => {
      setConnected(false)
      timerRef.current = setTimeout(() => {
        delayRef.current = Math.min(delayRef.current * 2, 30000)
        connect()
      }, delayRef.current)
    }

    ws.onerror = () => ws.close()
  }, [persist])

  useEffect(() => {
    connect()
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
      setupPushSubscription()
    }
    return () => {
      clearTimeout(timerRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  function handleInterval(seconds) {
    setIntervalVal(seconds)
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'set_interval', seconds }))
    }
  }

  async function enableNotifications() {
    setNotifState('requesting')
    const permission = await Notification.requestPermission()
    setNotifState(permission)
    if (permission === 'granted') {
      await setupPushSubscription()
    }
  }

  async function updatePushFilters(region, city) {
    if (notifState !== 'granted' || !('serviceWorker' in navigator)) return
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (!sub) return
      await fetch(`${API_BASE}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sub.toJSON(), filter_region: region, filter_city: city }),
      })
    } catch (e) {
      console.error('Push filter update failed:', e)
    }
  }

  function handleRegionChange(value) {
    setSelectedRegion(value)
    setSelectedCity('')
    updatePushFilters(value, '')
  }

  function handleCityChange(value) {
    setSelectedCity(value)
    updatePushFilters(selectedRegion, value)
  }

  const showNotifButton = notifState === 'default' && 'serviceWorker' in navigator

  return (
    <div className="app">
      <header className="header glass-panel">
        <div className="header-top">
          <h1>P2000 Reader</h1>
          <div className="header-right">
            <div className={`status ${connected ? 'connected' : 'disconnected'}`}>
              <span className="dot" />
              {connected ? 'Live' : 'Verbroken – opnieuw verbinden…'}
            </div>
            <select
              className="interval-select"
              value={interval}
              onChange={e => handleInterval(Number(e.target.value))}
            >
              {INTERVAL_OPTIONS.map(o => (
                <option key={o.seconds} value={o.seconds}>{o.label}</option>
              ))}
            </select>
            {showNotifButton && (
              <button
                className="notif-btn"
                onClick={enableNotifications}
                title="Schakel pushmeldingen in"
              >
                🔔
              </button>
            )}
          </div>
        </div>

        <div className="header-filters">
          <div className="filter-wrapper">
            <input
              list="regions-list"
              className="filter-input"
              value={selectedRegion}
              onChange={e => handleRegionChange(e.target.value)}
              placeholder="Alle veiligheidsregio's"
            />
            <datalist id="regions-list">
              {regions.map(r => <option key={r} value={r} />)}
            </datalist>
            {selectedRegion && (
              <button className="filter-clear" onClick={() => handleRegionChange('')} title="Wis regio">×</button>
            )}
          </div>

          <div className="filter-wrapper">
            <input
              list="cities-list"
              className="filter-input"
              value={selectedCity}
              onChange={e => handleCityChange(e.target.value)}
              placeholder={selectedRegion ? 'Alle plaatsen' : 'Selecteer eerst een regio'}
              disabled={!selectedRegion}
            />
            <datalist id="cities-list">
              {placesForRegion.map(c => <option key={c} value={c} />)}
            </datalist>
            {selectedCity && (
              <button className="filter-clear" onClick={() => handleCityChange('')} title="Wis plaats">×</button>
            )}
          </div>
        </div>
      </header>

      <main className="alert-list">
        {filteredAlerts.length === 0 && (
          <div className="empty">
            {alerts.length === 0 ? 'Geen meldingen ontvangen' : 'Geen meldingen voor deze filter'}
          </div>
        )}
        {filteredAlerts.map(alert => (
          <div
            key={alert.id}
            className="alert-card glass-panel"
            style={{ borderLeftColor: getColor(alert.service) }}
          >
            <div className="alert-emoji">{alert.emoji}</div>
            <div className="alert-content">
              <div className="alert-header">
                <span className="alert-service">{alert.service}</span>
                <span className="alert-region">{alert.region}</span>
                <span className="alert-datetime">{alert.datetime}</span>
              </div>
              <div className="alert-message">{renderMessage(alert.message)}</div>
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
