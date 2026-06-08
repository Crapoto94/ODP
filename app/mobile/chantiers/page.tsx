import MobileListPage from '../_components/MobileListPage';

export default function MobileChantiers() {
  return (
    <MobileListPage
      title="Chantiers & Tournages"
      accentColor="bg-gradient-to-r from-orange-500 to-amber-500"
      apiParams={{ view: 'ACTIVE' }}
      filterTypes={['CHANTIER', 'TOURNAGE']}
    />
  );
}
