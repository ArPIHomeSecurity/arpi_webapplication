/* global jasmine */

import { MatDialog } from "@angular/material/dialog"
import { MatSnackBar } from "@angular/material/snack-bar"
import { ActivatedRoute, convertToParamMap, Router } from "@angular/router"
import { of } from "rxjs"

import { Area, MONITORING_STATE, Sensor, SensorType, ZigbeeDevice, Zone } from "@app/models"
import {
  AreaService,
  AuthenticationService,
  LoaderService,
  MonitoringService,
  SensorService,
  ZigbeeService,
  ZoneService
} from "@app/services"
import { SensorViewComponent } from "./sensor-view.component"

describe("SensorViewComponent", () => {
  let component: SensorViewComponent
  let sensorService: jasmine.SpyObj<SensorService>
  let authService: jasmine.SpyObj<AuthenticationService>
  let loader: jasmine.SpyObj<LoaderService>
  let router: jasmine.SpyObj<Router>
  let dialog: jasmine.SpyObj<MatDialog>
  let snackBar: jasmine.SpyObj<MatSnackBar>

  const sensor = Object.assign(new Sensor(), {
    id: 17,
    name: "Front door",
    description: "Main entrance",
    channel: 0,
    typeId: 1,
    areaId: 2,
    zoneId: 3,
    enabled: true,
    uiHidden: false,
    silentAlert: false,
    monitorPeriod: 30,
    monitorThreshold: 80
  })

  beforeEach(() => {
    sensor.uiOrder = 1
    sensorService = jasmine.createSpyObj<SensorService>("SensorService", [
      "getSensor",
      "getSensors",
      "getSensorTypes",
      "resetReference",
      "deleteSensor"
    ])
    sensorService.getSensor.and.returnValue(of(sensor))
    sensorService.getSensors.and.returnValue(of([sensor]))
    sensorService.getSensorTypes.and.returnValue(of([{ id: 1, name: "Motion" } as SensorType]))

    const zigbeeService = jasmine.createSpyObj<ZigbeeService>("ZigbeeService", ["getDevices"])
    zigbeeService.getDevices.and.returnValue(of([] as ZigbeeDevice[]))
    const zoneService = jasmine.createSpyObj<ZoneService>("ZoneService", ["getZones"])
    zoneService.getZones.and.returnValue(of([Object.assign(new Zone(), { id: 3, name: "Entry" })]))
    const areaService = jasmine.createSpyObj<AreaService>("AreaService", ["getAreas"])
    areaService.getAreas.and.returnValue(
      of([Object.assign(new Area(), { id: 2, name: "Ground floor" })])
    )
    authService = jasmine.createSpyObj<AuthenticationService>("AuthenticationService", ["getRole"])
    authService.getRole.and.returnValue("user")
    sensorService.deleteSensor.and.returnValue(of(true))
    const monitoringService = jasmine.createSpyObj<MonitoringService>("MonitoringService", [
      "getBoardVersion"
    ])
    monitoringService.getBoardVersion.and.returnValue(of(3))
    loader = jasmine.createSpyObj<LoaderService>("LoaderService", ["display", "disable"])
    router = jasmine.createSpyObj<Router>("Router", ["navigate"])
    router.navigate.and.returnValue(Promise.resolve(true))
    dialog = jasmine.createSpyObj<MatDialog>("MatDialog", ["open"])
    dialog.open.and.returnValue({ afterClosed: () => of("ok") } as unknown as ReturnType<
      MatDialog["open"]
    >)
    snackBar = jasmine.createSpyObj<MatSnackBar>("MatSnackBar", ["open"])

    component = new SensorViewComponent(
      null,
      loader,
      monitoringService,
      sensorService,
      areaService,
      zigbeeService,
      zoneService,
      authService,
      router,
      {
        snapshot: { paramMap: convertToParamMap({ id: "17" }) }
      } as ActivatedRoute,
      dialog,
      snackBar
    )
  })

  it("loads one sensor and builds the same card attributes as the sensor list", () => {
    component.loadSensor()

    expect(sensorService.getSensor).toHaveBeenCalledOnceWith(sensor.id)
    expect(sensorService.getSensors).toHaveBeenCalledOnceWith()
    expect(component.sensor).toBe(sensor)
    expect(component.sensorIndex).toBe(0)
    expect(component.previousSensorId).toBeNull()
    expect(component.nextSensorId).toBeNull()
    expect(component.iconName).toBe("directions_run")
    expect(component.attributeGroups.flat().map(attribute => attribute.contents)).toContain("Entry")
    expect(component.attributeGroups.flat().map(attribute => attribute.contents)).toContain(
      "Ground floor"
    )
    expect(component.notFound).toBeFalse()
    expect(component.loadError).toBeFalse()
  })

  it("sorts the collection by display order and navigates to adjacent sensors", () => {
    const firstSensor = Object.assign(new Sensor(), { id: 12, uiOrder: 0 })
    const lastSensor = Object.assign(new Sensor(), { id: 19, uiOrder: 2 })
    sensor.uiOrder = 1
    sensorService.getSensors.and.returnValue(of([lastSensor, sensor, firstSensor]))

    component.loadSensor()

    expect(component.sensors.map(item => item.id)).toEqual([
      firstSensor.id,
      sensor.id,
      lastSensor.id
    ])
    expect(component.sensorIndex).toBe(1)
    expect(component.previousSensorId).toBe(firstSensor.id)
    expect(component.nextSensorId).toBe(lastSensor.id)

    component.navigateToSensor(component.previousSensorId)
    expect(router.navigate).toHaveBeenCalledOnceWith(["/sensors", firstSensor.id])
  })

  it("disables navigation at collection boundaries and ignores invalid destinations", () => {
    const otherSensor = Object.assign(new Sensor(), { id: 19, uiOrder: 1 })
    sensor.uiOrder = 0
    sensorService.getSensors.and.returnValue(of([otherSensor, sensor]))

    component.loadSensor()

    expect(component.previousSensorId).toBeNull()
    expect(component.nextSensorId).toBe(otherSensor.id)
    component.navigateToSensor(null)
    component.navigateToSensor(999)
    expect(router.navigate).not.toHaveBeenCalled()

    sensor.uiOrder = 2
    sensorService.getSensors.and.returnValue(of([sensor, otherSensor]))
    component.loadSensor()

    expect(component.previousSensorId).toBe(otherSensor.id)
    expect(component.nextSensorId).toBeNull()
  })

  it("exposes card actions only to admins and resets the selected sensor references", () => {
    expect(component.userCanEdit()).toBeFalse()
    authService.getRole.and.returnValue("admin")
    expect(component.userCanEdit()).toBeTrue()

    component.onResetReferences(sensor.id)

    expect(sensorService.resetReference).toHaveBeenCalledOnceWith(sensor.id)
  })

  it("confirms admin deletion and returns to the sensor list", () => {
    component.sensor = sensor
    component.monitoringState = MONITORING_STATE.READY

    component.openDeleteDialog(sensor.id)

    expect(dialog.open).toHaveBeenCalled()
    expect(sensorService.deleteSensor).toHaveBeenCalledOnceWith(sensor.id)
    expect(router.navigate).toHaveBeenCalledOnceWith(["/sensors"])
    expect(loader.disable).toHaveBeenCalledWith(true)
    expect(loader.disable).toHaveBeenCalledWith(false)
  })
})
