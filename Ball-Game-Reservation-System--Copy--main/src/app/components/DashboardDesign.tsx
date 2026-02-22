import { useMemo, useState } from 'react';
import { MapPin, CalendarDays, Search, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';

type CourtStatus = 'Available' | 'Limited' | 'Few Slots';

interface CourtCardData {
  id: string;
  courtId: string;
  name: string;
  location: string;
  sport: string;
  price: string;
  status: CourtStatus;
  image: string;
  tags: string[];
}

const COURTS: CourtCardData[] = [
  {
    id: '1',
    courtId: 'c1',
    name: 'Downtown Basketball Court A',
    location: 'Downtown Sports Complex',
    sport: 'Basketball',
    price: 'PHP 30/hour',
    status: 'Available',
    image: '/basketball.png',
    tags: ['indoor', 'air conditioning', 'lighting', 'scoreboard'],
  },
  {
    id: '2',
    courtId: 'c2',
    name: 'Riverside Tennis Court 1',
    location: 'Riverside Park',
    sport: 'Tennis',
    price: 'PHP 25/hour',
    status: 'Limited',
    image: '/tennis.png',
    tags: ['outdoor', 'lighting', 'net included', 'hard court'],
  },
  {
    id: '3',
    courtId: 'c3',
    name: 'Pickle Ball Court 1',
    location: 'Elite Sports Hub',
    sport: 'Pickle Ball',
    price: 'PHP 25/hour',
    status: 'Few Slots',
    image: '/pickle%20ball.png',
    tags: ['indoor', 'hard court', 'lighting', 'net included'],
  },
];

const statusStyles: Record<CourtStatus, string> = {
  Available: 'bg-lime-500/80 text-slate-900',
  Limited: 'bg-yellow-400/80 text-slate-900',
  'Few Slots': 'bg-rose-500/80 text-white',
};

export function DashboardDesign() {
  const navigate = useNavigate();
  const { courts } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSport, setSelectedSport] = useState('All Sports');

  const getCourtName = (courtId: string, fallbackName: string) => {
    return courts.find((court) => court.id === courtId)?.name || fallbackName;
  };

  const sportOptions = useMemo(
    () => ['All Sports', ...Array.from(new Set(COURTS.map((court) => court.sport)))],
    []
  );

  const filteredCourts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return COURTS.filter((court) => {
      const matchesSport = selectedSport === 'All Sports' || court.sport === selectedSport;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        getCourtName(court.courtId, court.name).toLowerCase().includes(normalizedSearch) ||
        court.location.toLowerCase().includes(normalizedSearch) ||
        court.sport.toLowerCase().includes(normalizedSearch) ||
        court.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch));

      return matchesSport && matchesSearch;
    });
  }, [searchTerm, selectedSport, courts]);

  return (
    <div className="min-h-screen bg-[#dce7e8] rounded-xl p-6 md:p-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-[1fr,280px] gap-4">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search courts or locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-14 rounded-lg bg-[#d3dcdd] border border-slate-300/60 pl-12 pr-4 text-slate-700 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="relative">
          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            className="w-full h-14 rounded-lg bg-[#d3dcdd] border border-slate-300/60 pl-4 pr-14 text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-teal-500 appearance-none"
          >
            {sportOptions.map((sport) => (
              <option key={sport} value={sport}>
                {sport}
              </option>
            ))}
          </select>
          <ChevronDown className="w-5 h-5 text-slate-600 absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
        {filteredCourts.map((court) => (
          <article key={court.id} className="h-full bg-[#e5e6e7] border border-slate-300/70 rounded-lg overflow-hidden shadow-sm flex flex-col">
            <div className="relative h-56">
              <img src={court.image} alt={court.name} className="w-full h-full object-cover" />
              <span className={`absolute top-4 right-4 px-4 py-1 rounded-xl text-lg font-semibold ${statusStyles[court.status]}`}>
                {court.status}
              </span>
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <div className="min-h-[100px]">
                <h3 className="text-2xl font-bold text-slate-900 leading-tight">{getCourtName(court.courtId, court.name)}</h3>
                <p className="text-slate-700 mt-2 flex items-center gap-2 text-xl">
                  <MapPin className="w-5 h-5" />
                  {court.location}
                </p>
              </div>

              <div className="flex items-center justify-between text-xl mt-2">
                <span className="text-slate-700">Sport</span>
                <span className="px-4 py-1 rounded-xl bg-teal-500 text-white font-semibold text-lg">
                  {court.sport}
                </span>
              </div>

              <div className="flex items-center justify-between text-xl mt-2">
                <span className="text-slate-700">Price</span>
                <span className="font-bold text-slate-900">{court.price}</span>
              </div>

              <div className="flex flex-wrap gap-2 min-h-[72px] content-start mt-3">
                {court.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full text-sm bg-white border border-slate-300 text-slate-700">
                    {tag}
                  </span>
                ))}
              </div>

              <button
                onClick={() => navigate('/booking', { state: { prefillCourtId: court.courtId } })}
                className="w-full mt-4 py-3 rounded-lg bg-teal-600 text-white font-bold text-xl hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
              >
                <CalendarDays className="w-5 h-5" />
                Book Now
              </button>
            </div>
          </article>
        ))}
      </div>
      {filteredCourts.length === 0 && (
        <div className="text-center py-10 text-slate-600 font-medium">
          No courts found for your search/filter.
        </div>
      )}
    </div>
  );
}
