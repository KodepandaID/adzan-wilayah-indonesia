const adhan = require('adhan')
const moment = require('moment-timezone')

const getPrayerTime = (region) => {
  const date = new Date()

  const coordinates = new adhan.Coordinates(region.lat, region.lng)
  const params = adhan.CalculationMethod.Other()
  params.madhab = adhan.Madhab.Shafi
  params.fajrAngle = 20
  params.ishaAngle = 18

  const prayerTimes = new adhan.PrayerTimes(coordinates, date, params)
  var fajrTime = moment(prayerTimes.fajr).tz(region.timezone)
  var sunriseTime = moment(prayerTimes.sunrise).tz(region.timezone)
  var dhuhrTime = moment(prayerTimes.dhuhr).tz(region.timezone)
  var asrTime = moment(prayerTimes.asr).tz(region.timezone)
  var maghribTime = moment(prayerTimes.maghrib).tz(region.timezone)
  var ishaTime = moment(prayerTimes.isha).tz(region.timezone)

  return {
    fajr: fajrTime.format('h:mm A'),
    fajr_unix: fajrTime.unix(),
    sunrise: sunriseTime.format('h:mm A'),
    sunrise_unix: sunriseTime.unix(),
    dhuhr: dhuhrTime.format('h:mm A'),
    dhuhr_unix: dhuhrTime.unix(),
    asr: asrTime.format('h:mm A'),
    asr_unix: asrTime.unix(),
    maghrib: maghribTime.format('h:mm A'),
    maghrib_unix: maghribTime.unix(),
    isha: ishaTime.format('h:mm A'),
    isha_unix: ishaTime.unix(),
  }
}

module.exports.getPrayerTime = getPrayerTime