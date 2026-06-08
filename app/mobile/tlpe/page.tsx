import MobileListPage from '../_components/MobileListPage';

export default function MobileTLPE() {
  return (
    <MobileListPage
      title="T.L.P.E."
      accentColor="bg-gradient-to-r from-violet-500 to-purple-500"
      apiParams={{ view: 'ACTIVE' }}
      filterTypes={['TLPE']}
    />
  );
}
