export const mapGeoJSONTypeToLayerType = (geoJsonType) => {
    switch (geoJsonType) {
        case 'Point':
        case 'MultiPoint':
            return 'POINT';

        case 'LineString':
        case 'MultiLineString':
            return 'LINE';

        case 'Polygon':
        case 'MultiPolygon':
            return 'POLYGON';

        default:
            throw new Error(`Tipe geometri tidak didukung: ${geoJsonType}`);
    }
};