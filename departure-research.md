# Departure research

All times below are Japan local time. Observed Google Maps itineraries are samples, not guaranteed timetables. The public app uses standard Directions URLs; these do not lock a date, departure time or selected service. Each card explains how to select the visit date and arrival target again.

| Visit | Google Maps observation | Recommendation |
|---|---|---|
| Nov 4, teamLab | Arrival Nov 4 09:45; 08:58–09:45, 47 min including 11 min walking; Tōkaidō + Yurikamome | Leave 08:45, target 09:45 before 10:00–10:30 admission |
| Nov 9, MOMO Gion, Yamatocho 12 | Arrival Nov 9 10:15; 09:05–10:11, 66 min including 13 min walking; Sakaisuji + Hankyu-Kyoto. Keihan alternatives displayed an alert whose details were not verified. | Preserve existing 07:55 hotel departure and breakfast margin. Present Hankyu as an additional suggested route, keep original Yodoyabashi/Keihan itinerary intact |
| Nov 10, USJ | Arrival Nov 10 08:00; 07:25–07:57, 32 min including 12 min walking; Kintetsu-Nara through service + JR Yumesaki | Leave 07:10. 08:00 is a planning target, not a verified opening or booked entry time. Official date-specific opening was not verified |
| Nov 12, ANNEX | Arrival Nov 12 18:45; 17:59–18:44, 45 min including 22 min walking; Keihin-Tōhoku + Yamanote | Leave hotel 17:45 only if actually there; otherwise remain in Shibuya and navigate locally, target 18:45 |
| Nov 16, Disneyland | Backup route checked with departure-now on Oct 13: Keiyō + walk, 17 min. Not a Nov 16 timetable | Hotel shuttle recommended from official hotel information, be at 1F stop 07:00, aim for 07:10 shuttle |
| Nov 17, DisneySea | Backup route checked with departure-now on Oct 13: Keiyō + Disney Resort Line, 26 min; other bus options shown. Not a Nov 17 timetable | Same hotel shuttle recommendation |

Sources:
- [teamLab official access](https://teamlabplanets.dmm.com/en/guide/access_method): Shin-Toyosu one minute on foot; warns of congestion on public buses toward the venue.
- [ANNEX official address](https://www.headspatokyo.com/salon/the-headspa-tokyo-shibuya-annex): Shibuya 3-6-19 B1 B, weekdays until 21:00 / last admission 19:00.
- [Hotel shuttle timetable](https://www.oriental-hotel.co.jp/access/timeshuttle/): inspected the linked hotel-departure image visually, showing 07:00/10/20/30/40/50, same intervals in hours 08 and 09. Reconfirm the actual visit-day timetable at reception.
- [Hotel English FAQ](https://www.oriental-hotel.co.jp/en/): approximate 15–30 minutes, no reservation, first come first served.
- [Disneyland November calendar](https://www.tokyodisneyresort.jp/en/tdl/monthly/calendar/202611/): Nov 16 09:00–21:00.
- [DisneySea November calendar](https://www.tokyodisneyresort.jp/en/tds/monthly/calendar/202611/): Nov 17 09:00–21:00.
- [USJ hours](https://www.usj.co.jp/web/ja/jp/park-guide/schedule/park-hour/): provided to user for follow-up; no date-specific opening asserted.

Data boundaries: six external attraction visits cover twelve confirmed ticket/activity IDs. Six USJ internal entries share one hotel departure and retain their original windows. Food bookings, rail reservations and hotels are outside this attraction-only feature. No private booking reference, name, document or QR has been copied. The full original 17 days / 89 activities remain unchanged. This feature does not claim to complete the full itinerary migration.

`tests/fixtures/confirmed-attractions.json` contains only whitelisted fields (ID, date, time, end, kind, status). The local source audit verifies this against the private source; normal tests run without the private source.
