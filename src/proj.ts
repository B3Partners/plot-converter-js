import proj4 from 'proj4';

function init() {
    proj4.defs('EPSG:28992', '+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.417,50.3319,465.552,-0.398957,0.343988,-1.8774,4.0725 +units=m +no_defs');
    proj4.defs('http://www.opengis.net/gml/srs/epsg.xml#28992', proj4.defs('EPSG:28992'));
    proj4.defs('WGS84', '+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees');
    proj4.defs('EPSG:4326', '+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees');
}

init();

export function WGS84ToRD(lat: number, lon: number) {
    return proj4('EPSG:28992', [lon, lat]);
}

export function RDtoWSG84(lat: number, lon: number): number[] {
    return proj4('EPSG:28992', 'WGS84', [lon, lat]);
}
