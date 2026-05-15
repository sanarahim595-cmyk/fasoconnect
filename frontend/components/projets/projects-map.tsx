"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { LocateFixed, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";

import { Badge, Button } from "@/components/ui";
import { CommunityProject } from "@/lib/api";

type LatLng = {
  lat: number;
  lng: number;
};

const markerIcon = L.divIcon({
  className: "",
  html: '<div style="width:18px;height:18px;border-radius:999px;background:#16803c;border:3px solid white;box-shadow:0 8px 18px rgba(0,0,0,.25)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const userIcon = L.divIcon({
  className: "",
  html: '<div style="width:20px;height:20px;border-radius:999px;background:#f4c430;border:3px solid white;box-shadow:0 8px 18px rgba(0,0,0,.25)"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const categoryLabels: Record<string, string> = {
  eau: "Eau",
  ecole: "Ecole",
  sante: "Sante",
  route: "Route",
  energie_solaire: "Energie solaire",
  environnement: "Environnement",
  autre: "Autre",
};

export function ProjectMap({ projects, selectedPoint, onSelect }: { projects: CommunityProject[]; selectedPoint: LatLng; onSelect: (point: LatLng) => void }) {
  const [category, setCategory] = useState("all");
  const [city, setCity] = useState("all");
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [userPoint, setUserPoint] = useState<LatLng | null>(null);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);

  const approvedProjects = useMemo(
    () => projects.filter((project) => project.status === "approved" && project.latitude != null && project.longitude != null),
    [projects],
  );
  const cities = useMemo(() => Array.from(new Set(approvedProjects.map((project) => project.city).filter((item): item is string => Boolean(item)))).sort(), [approvedProjects]);
  const categories = useMemo(() => Array.from(new Set(approvedProjects.map((project) => project.category))).sort(), [approvedProjects]);
  const filteredProjects = useMemo(
    () =>
      approvedProjects.filter((project) => {
        const matchesCategory = category === "all" || project.category === category;
        const matchesCity = city === "all" || project.city === city;
        const reference = userPoint ?? selectedPoint;
        const matchesNearby = !nearbyOnly || distanceKm(reference, { lat: Number(project.latitude), lng: Number(project.longitude) }) <= 50;
        return matchesCategory && matchesCity && matchesNearby;
      }),
    [approvedProjects, category, city, nearbyOnly, selectedPoint, userPoint],
  );

  function locateUser() {
    if (!navigator.geolocation) {
      setGeoMessage("Geolocalisation indisponible sur cet appareil.");
      setNearbyOnly(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserPoint(next);
        onSelect(next);
        setNearbyOnly(true);
        setGeoMessage("Projets proches affiches dans un rayon de 50 km.");
      },
      () => {
        setNearbyOnly(true);
        setGeoMessage("Position non autorisee. Le rayon utilise le point selectionne sur la carte.");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 rounded-xl border border-stone-100 bg-stone-50 p-3 lg:grid-cols-[1fr_1fr_auto]">
        <label className="grid gap-1 text-xs font-black uppercase tracking-normal text-stone-500">
          Categorie
          <select className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm font-bold normal-case text-night outline-none focus:border-burkina-green focus:ring-4 focus:ring-burkina-green/10" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">Toutes</option>
            {categories.map((item) => (
              <option key={item} value={item}>{categoryLabels[item] ?? item}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-black uppercase tracking-normal text-stone-500">
          Commune
          <select className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm font-bold normal-case text-night outline-none focus:border-burkina-green focus:ring-4 focus:ring-burkina-green/10" value={city} onChange={(event) => setCity(event.target.value)}>
            <option value="all">Toutes</option>
            {cities.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap items-end gap-2">
          <Button onClick={locateUser} type="button" variant={nearbyOnly ? "secondary" : "outline"}>
            <LocateFixed className="h-4 w-4" aria-hidden="true" />
            Proches
          </Button>
          {nearbyOnly ? (
            <Button onClick={() => setNearbyOnly(false)} type="button" variant="ghost">
              Tout afficher
            </Button>
          ) : null}
        </div>
        <div className="lg:col-span-3 flex flex-wrap items-center gap-2 text-xs font-bold text-stone-500">
          <Badge variant="green">{filteredProjects.length} projet(s) valide(s)</Badge>
          {geoMessage ? <span>{geoMessage}</span> : <span>Clique sur la carte pour changer le point de reference.</span>}
        </div>
      </div>

      <div className="h-[28rem] overflow-hidden rounded-xl border border-stone-200 sm:h-[34rem]">
        <MapContainer center={[selectedPoint.lat, selectedPoint.lng]} zoom={6} scrollWheelZoom className="h-full w-full">
          <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClickHandler onSelect={onSelect} />
          <Marker icon={userIcon} position={[selectedPoint.lat, selectedPoint.lng]}>
            <Popup>Point de reference</Popup>
          </Marker>
          {filteredProjects.map((project) => (
              <Marker key={project.id} icon={markerIcon} position={[Number(project.latitude), Number(project.longitude)]}>
                <Popup minWidth={260} maxWidth={320}>
                  <ProjectPopup project={project} />
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>
    </div>
  );
}

function MapClickHandler({ onSelect }: { onSelect: (point: LatLng) => void }) {
  useMapEvents({
    click(event) {
      onSelect({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

function ProjectPopup({ project }: { project: CommunityProject }) {
  return (
    <div className="w-64 overflow-hidden rounded-lg bg-white text-night">
      {project.photos?.[0] ? <div className="mb-3 h-28 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${project.photos[0]})` }} /> : null}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <strong className="text-sm leading-5">{project.title}</strong>
          <span className="rounded-full bg-burkina-green/10 px-2 py-1 text-[10px] font-black text-burkina-green">Valide</span>
        </div>
        <p className="line-clamp-3 text-xs leading-5 text-stone-600">{project.description}</p>
        <div className="grid gap-1 text-xs font-bold text-stone-600">
          <span>{categoryLabels[project.category] ?? project.category}</span>
          <span>{project.city ?? "Commune non renseignee"}</span>
          <span>{formatMoney(project.target_amount)}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <a className="inline-flex h-9 items-center justify-center rounded-lg bg-burkina-green px-3 text-xs font-black text-white" href="/votes">
            Voter
          </a>
          <a className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-stone-200 bg-white px-3 text-xs font-black text-stone-700" href={`#project-${project.id}`}>
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            Details
          </a>
        </div>
      </div>
    </div>
  );
}

function distanceKm(origin: LatLng, target: LatLng) {
  const earthRadius = 6371;
  const latDistance = toRadians(target.lat - origin.lat);
  const lngDistance = toRadians(target.lng - origin.lng);
  const startLat = toRadians(origin.lat);
  const endLat = toRadians(target.lat);
  const value =
    Math.sin(latDistance / 2) * Math.sin(latDistance / 2) +
    Math.sin(lngDistance / 2) * Math.sin(lngDistance / 2) * Math.cos(startLat) * Math.cos(endLat);
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(value);
}
