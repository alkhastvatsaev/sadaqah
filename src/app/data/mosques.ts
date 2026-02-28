export interface Mosque {
  id: number | string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  neighborhood: string;
  siret?: string;
  slug: string;
}

export const STRASBOURG_MOSQUES: Mosque[] = [
  { id: 1, name: 'Grande Mosquée de Strasbourg', address: '6 Rue Averroès, 67100 Strasbourg', lat: 48.5692, lng: 7.7825, neighborhood: 'Heyritz', slug: 'grande-mosquee' },
  { id: 2, name: 'Mosquée Fatih', address: '3 Rue du Jeu-de-Paume, 67000 Strasbourg', lat: 48.5810, lng: 7.7445, neighborhood: 'Centre', slug: 'fatih' },
  { id: 3, name: 'Mosquée Eyüp Sultan', address: '3 Rue Thomas Mann, 67200 Strasbourg', lat: 48.6050, lng: 7.7190, neighborhood: 'Cronenbourg', slug: 'eyup-sultan' },
  { id: 4, name: 'Mosquée En-Nour', address: '6 Rue de Soleure, 67100 Strasbourg', lat: 48.5610, lng: 7.7480, neighborhood: 'Neudorf', slug: 'en-nour' },
  { id: 5, name: 'Mosquée Al-Ihsan', address: '2 Rue de Dettwiller, 67200 Strasbourg', lat: 48.5930, lng: 7.7130, neighborhood: 'Hautepierre', slug: 'al-ihsan' },
  { id: 6, name: 'Mosquée Arrahma', address: '1 Rue de Wasselonne, 67200 Strasbourg', lat: 48.5960, lng: 7.7100, neighborhood: 'Hautepierre', slug: 'arrahma' },
  { id: 7, name: 'Mosquée Al Fath', address: '8 Rue Sleidan, 67000 Strasbourg', lat: 48.5830, lng: 7.7580, neighborhood: 'Centre', slug: 'al-fath' },
  { id: 8, name: 'Mosquée Eyyub Sultan', address: '22 Rue de Barr, 67100 Strasbourg', lat: 48.5580, lng: 7.7680, neighborhood: 'Meinau', slug: 'eyyub-sultan' },
  { id: 9, name: 'Mosquée Al-Oumma', address: '21 Rue de Sélestat, 67100 Strasbourg', lat: 48.5550, lng: 7.7620, neighborhood: 'Neuhof', slug: 'al-oumma' },
  { id: 10, name: 'Mosquée Tevhid', address: '2 Rue de Fréland, 67200 Strasbourg', lat: 48.5990, lng: 7.7200, neighborhood: 'Cronenbourg', slug: 'tevhid' },
  { id: 11, name: 'Mosquée As-Salam', address: '20 Rue de Bouxwiller, 67000 Strasbourg', lat: 48.5890, lng: 7.7350, neighborhood: 'Gare', slug: 'as-salam' },
  { id: 12, name: 'Mosquée El-Forkane', address: '2 Rue de Mutzig, 67200 Strasbourg', lat: 48.5940, lng: 7.7160, neighborhood: 'Hautepierre', slug: 'el-forkane' },
  { id: 13, name: 'Mosquée Koenigshoffen', address: '29 Route des Romains, 67200 Strasbourg', lat: 48.5780, lng: 7.7100, neighborhood: 'Koenigshoffen', slug: 'koenigshoffen' },
  { id: 14, name: 'Mosquée de la Paix', address: '1 Rue de Lingolsheim, 67380 Lingolsheim', lat: 48.5560, lng: 7.6850, neighborhood: 'Lingolsheim', slug: 'paix' },
  { id: 15, name: 'Mosquée Schiltigheim', address: '79 Route de Bischwiller, 67300 Schiltigheim', lat: 48.6100, lng: 7.7450, neighborhood: 'Schiltigheim', slug: 'schiltigheim' },
  { id: 16, name: 'Mosquée Illkirch', address: '5 Rue des Vignes, 67400 Illkirch-Graffenstaden', lat: 48.5290, lng: 7.7180, neighborhood: 'Illkirch', slug: 'illkirch' },
  { id: 17, name: 'Mosquée El Houda', address: '10 Rue de Bâle, 67100 Strasbourg', lat: 48.5540, lng: 7.7710, neighborhood: 'Neuhof', slug: 'el-houda' },
  { id: 18, name: 'Mosquée Haguenau', address: '8 Rue des Roses, 67500 Haguenau', lat: 48.8150, lng: 7.7900, neighborhood: 'Haguenau', slug: 'haguenau' },
  { id: 19, name: 'Mosquée Шейла Бинт-Иса', address: 'Lenin St 7/1, Pavlodar 140000, Kazakhstan', lat: 52.2855, lng: 76.9540, neighborhood: 'Pavlodar', slug: 'sheila-bint-isa' },
  { 
    id: 20, 
    name: "Mosquée de l'Elsau", 
    address: "101 rue de l'unterelsau, 67200 Strasbourg", 
    lat: 48.5670, 
    lng: 7.7280, 
    neighborhood: 'Elsau', 
    siret: '50525980400019',
    slug: 'elsau'
  },
];
