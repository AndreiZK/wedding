/**
 * Minimal ambient types for the slice of the Google Maps JavaScript API we use
 * (`<VenueMap>`). Hand-rolled rather than pulling in `@types/google.maps` — we only
 * touch `Map` + `Marker` + a style array, and this keeps the dependency surface
 * lean (and satisfies the no-`any` rule). Widen as needed if usage grows.
 */
declare namespace google.maps {
  type MapTypeStyle = {
    featureType?: string;
    elementType?: string;
    stylers: Array<Record<string, string | number>>;
  };

  interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  interface MapOptions {
    center?: LatLngLiteral;
    zoom?: number;
    disableDefaultUI?: boolean;
    clickableIcons?: boolean;
    keyboardShortcuts?: boolean;
    gestureHandling?: "cooperative" | "greedy" | "none" | "auto";
    backgroundColor?: string;
    styles?: MapTypeStyle[];
  }

  class Map {
    constructor(el: HTMLElement, opts?: MapOptions);
  }

  enum SymbolPath {
    CIRCLE = 0,
  }

  interface Symbol {
    path: SymbolPath | string;
    scale?: number;
    fillColor?: string;
    fillOpacity?: number;
    strokeColor?: string;
    strokeWeight?: number;
  }

  interface MarkerOptions {
    position?: LatLngLiteral;
    map?: Map;
    title?: string;
    icon?: Symbol | string;
  }

  class Marker {
    constructor(opts?: MarkerOptions);
    setMap(map: Map | null): void;
  }
}

interface Window {
  google?: typeof google;
  /** JSONP-style callback the Maps loader script invokes when ready. */
  __onGoogleMapsReady?: () => void;
}
