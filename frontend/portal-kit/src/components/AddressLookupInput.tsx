import React, { useEffect, useState, useRef } from "react";
import { Search, MapPin, Navigation, Loader2, CheckCircle2 } from "lucide-react";
import { call } from "../api/client";

export interface PlaceResult {
  title: string;
  address: string;
  geo?: string;
  lat?: number;
  lon?: number;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  phone?: string;
}

export interface AddressLookupInputProps {
  value?: string;
  onChange?: (val: string) => void;
  onSelect?: (place: PlaceResult) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  enableGeoProximity?: boolean;
  lookupType?: "address" | "business" | "all";
}

export const AddressLookupInput: React.FC<AddressLookupInputProps> = ({
  value = "",
  onChange,
  onSelect,
  placeholder = "Search venue, company, or address...",
  label = "Address & Location Lookup",
  className = "",
  enableGeoProximity = true,
  lookupType = "all",
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locating, setLocating] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const payload: Record<string, any> = {
          query: query.trim(),
          lookup_type: lookupType,
        };
        if (userCoords) {
          payload.user_lat = userCoords.lat;
          payload.user_lon = userCoords.lon;
        }

        const res = await call("entertainment_express.api.venues.search_places_autocomplete", payload);
        if (Array.isArray(res)) {
          setSuggestions(res);
          setShowSuggestions(res.length > 0);
        }
      } catch {
        // Fallback silently
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, userCoords, lookupType]);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setUserCoords({ lat, lon });

        try {
          const res = await call("entertainment_express.api.venues.reverse_geocode_location", { lat, lon });
          if (res && res.address) {
            setQuery(res.address);
            if (onChange) onChange(res.address);
            if (onSelect) onSelect(res);
          }
        } catch {
          // Fallback
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        console.warn("GPS location error:", err.message);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSelect = (place: PlaceResult) => {
    setQuery(place.address || place.title);
    setShowSuggestions(false);
    if (onChange) onChange(place.address || place.title);
    if (onSelect) onSelect(place);
  };

  return (
    <div ref={wrapperRef} className={`relative space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between text-xs font-bold text-[var(--ee-text)]">
          <label className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[var(--ee-brand)]" />
            {label}
          </label>

          {enableGeoProximity && (
            <button
              type="button"
              onClick={handleUseLocation}
              disabled={locating}
              className="text-[11px] font-semibold text-[var(--ee-brand)] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              {locating ? (
                <Loader2 className="w-3 h-3 animate-spin text-[var(--ee-brand)]" />
              ) : (
                <Navigation className="w-3 h-3 text-[var(--ee-brand)]" />
              )}
              {userCoords ? "GPS Active (Near Me)" : "Use My Location"}
            </button>
          )}
        </div>
      )}

      <div className="relative">
        <Search className="w-4 h-4 text-[var(--ee-muted)] absolute left-3 top-2.5 pointer-events-none" />
        <input
          className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-[var(--ee-border)] bg-[var(--ee-surface-inset)] text-[var(--ee-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ee-brand)] transition-shadow"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (onChange) onChange(e.target.value);
          }}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        />

        {searching && (
          <Loader2 className="w-4 h-4 text-[var(--ee-brand)] animate-spin absolute right-3 top-2.5" />
        )}
      </div>

      {/* Touch-Optimized Mobile Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in-50 duration-200">
          {suggestions.map((item, idx) => (
            <button
              key={idx}
              type="button"
              className="w-full text-left p-3.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors flex items-start gap-3 group active:bg-emerald-100"
              onClick={() => handleSelect(item)}
            >
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0 group-hover:scale-105 transition-transform">
                <MapPin className="w-4 h-4" />
              </div>

              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate flex items-center justify-between">
                  <span>{item.title}</span>
                  {item.phone && (
                    <span className="text-[10px] text-emerald-600 font-semibold">{item.phone}</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {item.address}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressLookupInput;
