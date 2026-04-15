useEffect(() => {
  async function loadHeatmapData() {
    const [citizensRes, policeRes] = await Promise.all([
      fetch('/api/citizens/heat'),
      fetch('/api/police-stations')
    ]);

    const citizens = await citizensRes.json();
    const police = await policeRes.json();

    const citizenPoints = citizens.map(item => ({
      lat: item.latitude ?? item.lat,
      lng: item.longitude ?? item.lng,
      weight: item.weight ?? 1
    }));

    const policePoints = police.map(station => ({
      lat: station.latitude ?? station.lat,
      lng: station.longitude ?? station.lng,
      weight: 4
    }));

    setHeatPoints([...citizenPoints, ...policePoints]);
    setPoliceStations(police);
  }

  loadHeatmapData();
}, []);