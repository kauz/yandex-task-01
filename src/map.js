import { loadList, loadDetails } from './api';
import { getDetailsContentLayout } from './details';
import { createFilterControl } from './filter';

export function initMap(ymaps, containerId) {
  const myMap = new ymaps.Map(containerId, {
    center: [55.76, 37.64],
    controls: [],
    zoom: 10
  });

  const objectManager = new ymaps.ObjectManager({
    clusterize: true,
    gridSize: 64,
    clusterIconLayout: 'default#pieChart',
    clusterDisableClickZoom: false,
    geoObjectOpenBalloonOnClick: false,
    geoObjectHideIconOnBalloonOpen: false,
    geoObjectBalloonContentLayout: getDetailsContentLayout(ymaps)
  });
  myMap.geoObjects.add(objectManager);

  objectManager.clusters.options.set('preset', 'islands#greenClusterIcons');

  objectManager.clusters.events.add('add', (e) => {
    var cluster = objectManager.clusters.getById(e.get('objectId')),
        objects = cluster.properties.geoObjects;
    const hasDefective = objects.find(o => !o.isActive);
    if (hasDefective) {
      const hasActive = objects.find(o => o.isActive);
      objectManager.clusters.setClusterOptions(cluster.id, {
        preset: hasActive ? 'islands#orangeClusterIcons' : 'islands#redClusterIcons'
      });
    }
  });

  loadList().then(data => {
    objectManager.add(data);
  });

  // details
  objectManager.objects.events.add('click', event => {
    const objectId = event.get('objectId');
    const obj = objectManager.objects.getById(objectId);

    objectManager.objects.balloon.open(objectId);

    if (!obj.properties.details) {
      loadDetails(objectId).then(data => {
        obj.properties.details = data;
        objectManager.objects.balloon.setData(obj);
      });
    }
  });

  // filters
  const listBoxControl = createFilterControl(ymaps);
  myMap.controls.add(listBoxControl);

  var filterMonitor = new ymaps.Monitor(listBoxControl.state);
  filterMonitor.add('filters', filters => {
    objectManager.setFilter(
      obj => filters[obj.isActive ? 'active' : 'defective']
    );
  });
}
