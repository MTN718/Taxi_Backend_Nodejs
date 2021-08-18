import Redis from "../../redis/redis";
import Config from "../../config";
import Notifier from "../../notifier/notifier";
import Container from "typedi";
let redis: Redis
beforeAll(() => {
  let config = (new Config()).settings
  redis = new Redis(config.redis)
})
describe('Driver Location', () => {
  it('new', async () => {
    await redis.driver.setCoordinate(1, {y: 10, x: 11})
    await redis.driver.setCoordinate(2, {y: 20, x: 11})
  });
  it('get', async () => {
    let location = await redis.driver.getCoordinate(1)
    expect(Math.round(location.y)).toEqual(10)
    expect(Math.round(location.x)).toEqual(11)
  })
  it('getAll', async () => {
    let all = await redis.driver.getAll()
    expect(all.length).toEqual(2)
  })
  it('getClose', async () => {
    let close = await redis.driver.getClose({y: 10, x: 11},1000)
    expect(close.length).toEqual(1)
  })
  it('delete', async () => {
    await Promise.all([
      redis.driver.expire(1),
      redis.driver.expire(2)
    ])
    let all = await redis.driver.getAll()
    expect(all).toHaveLength(0)
  })
})

describe('Requests', () => {
  beforeAll(async () => {
    await redis.driver.setCoordinate(1, {y: 10, x: 11})
  })
  it('new', async () => {
    /*await redis.request.add({pickup_point: {y: 10, x: 11}, id: 1}, -15)
    await redis.request.add({points: [{y: 10, x: 11}], id: 2}, 10)
    await redis.request.add({pickup_point: {y: 10, x: 11}, id: 3}, 40)*/
  })
  it('forDriver', async () => {
    let request = await redis.request.getForDriver(1)
    expect(1).toHaveLength(1)
    expect(request[0].id).toEqual(2)
  })
  it('notifiedDrivers', async () => {
    await redis.request.driverNotified(2, 1)
    let notified = await redis.request.getDriversNotified(2)
    expect(notified).toHaveLength(1)
    expect(notified[0]).toEqual(1)
  })
  it('expire', async () => {
    await Promise.all([
      redis.request.expire(1),
      redis.request.expire(2),
      redis.request.expire(3)
    ])
    let reqs = await redis.request.getForDriver(1)
    expect(reqs).toHaveLength(0)

  })
})

describe('Cleaner', () => {
  beforeAll(async () => {
    await redis.driver.setCoordinate(1, {y: 10, x: 11})
    await redis.driver.redis.geoaddAsync('driver', 11, 10, 3);
    await redis.driver.redis.zaddAsync('driver-location-time', Date.now() - (60 * 600000), 3);
    /*await redis.request.add({pickup_point: {latitude: 10, longitude: 11}, id: 1}, -15)
    await redis.request.add({pickup_point: {latitude: 10, longitude: 11}, id: 2}, 10)
    await redis.request.add({pickup_point: {latitude: 10, longitude: 11}, id: 3}, 40)*/
  })
})

afterAll(async () => {
  await (Container.get('redis') as any).FLUSHALL()
})