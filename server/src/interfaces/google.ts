export interface Metadata {
  title: string;
  description: string;
  imageViews: string;
  creationTime: {
    timestamp: string;
    formatted: string;
  };
  photoTakenTime: {
    timestamp: string;
    formatted: string;
  };
  geoData: {
    latitude: number;
    longitude: number;
    altitude: number;
    latitudeSpan: number;
    longitudeSpan: number;
  };
  geoDataExif: {
    latitude: number;
    longitude: number;
    altitude: number;
    latitudeSpan: number;
    longitudeSpan: number;
  };
  url: string;
  googlePhotosOrigin: {
    fromSharedAlbum: Record<string, unknown>;
  };
}
