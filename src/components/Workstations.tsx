import { useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { M, mat } from '../scene/materials'
import { BX2, BZ, BZ2, CL, CL2, CR, CR2, DZ, DZ3, EX3, HALF, LX, LX2, V } from '../scene/constants'
import { Workstation } from './props/Desk'
import {
  Chair, DeskFrame, FloorFan, Keyboard, Monitor, Mug, Plant, Plaque, Rail, Robot,
  StackPaper, Trophy,
} from './props/Furniture'
import {
  a11yPosterTex, almanacTex, diplomaTex, npsPosterTex, peakLabelTex, stickyTex,
  texasTex, thesisCoverTex,
} from '../textures/signage'
import { Box, Panel } from './props/primitives'
import { Collectable } from './props/Collectable'
import { Pickable } from './props/Pickable'
import { FEED } from './b2/Broadcast'

/**
 * A rack of blinking status lights, on the aisle face of the server rack.
 * `n` sets how many; a row of eight reads as a switch, six as a node.
 */
function StatusLights({
  x,
  y,
  z,
  n = 6,
  ry = 0,
}: {
  x: number
  y: number
  z: number
  n?: number
  /** Which way the rack's face is turned. A plane draws on its +Z side only. */
  ry?: number
}) {
  const mats = useMemo(
    () =>
      Array.from(
        { length: n },
        (_, i) =>
          new THREE.MeshStandardMaterial({
            color: 0,
            emissive: i % 4 === 3 ? 0xffa000 : i % 4 === 1 ? 0x40a0ff : 0x40ff70,
            emissiveIntensity: 2,
          }),
      ),
    [n],
  )
  return (
    <>
      {mats.map((m, i) => {
        const dx = ((i % 4) - 1.5) * 0.16
        return (
          <mesh
            key={i}
            position={[x + dx * Math.cos(ry), y + Math.floor(i / 4) * 0.16, z - dx * Math.sin(ry)]}
            rotation={[0, ry, 0]}
            material={m}
          >
            <planeGeometry args={[0.06, 0.06]} />
          </mesh>
        )
      })}
    </>
  )
}

/**
 * James — systems engineering, NW cubicle, desk under the window.
 *
 * Keeps chickens. There is a photograph of a hen and her brood on the panel
 * he faces, the farm gate framed on the wall beside him, a copy of the
 * almanac by the keyboard, and the rubber Inaccessible Island rail on the
 * desk is the one he debugs at. The hackathon plaque that hung where the farm
 * does came down.
 */
function James() {
  const [hen, farm] = useTexture(['/textures/hen.webp', '/textures/farm.webp'])
  const photo = useMemo(() => {
    hen.colorSpace = THREE.SRGBColorSpace
    hen.anisotropy = 8
    return new THREE.MeshStandardMaterial({ map: hen, roughness: 0.6 })
  }, [hen])
  const farmPhoto = useMemo(() => {
    farm.colorSpace = THREE.SRGBColorSpace
    farm.anisotropy = 8
    return new THREE.MeshStandardMaterial({ map: farm, roughness: 0.6 })
  }, [farm])
  const frame = useMemo(() => M(0x2f2a22, { roughness: 0.55 }), [])
  const cover = useMemo(
    () => new THREE.MeshStandardMaterial({ map: almanacTex(), roughness: 0.85 }),
    [],
  )
  const pages = useMemo(() => M(0xe8e2d2, { roughness: 0.95 }), [])
  return (
    <>
      <Workstation x={-5.5} z={-16.4} ry={Math.PI} w={6.5} d={2.6} chair={mat.black} stapler={false}>
        <Monitor
          x={-1.3}
          z={0.5}
          ry={0}
          screen={{
            kind: 'terminal',
            title: 'ssh — pii-prod-03',
            lines: [
              '$ ssh pii-prod-03',
              'Last login: Tue Sep 15',
              '$ tail -f /var/log/nginx',
              '200 GET /portal/ 12ms',
              '200 GET /api/v2/ 8ms',
              '503 GET /elevator/ --',
            ],
          }}
        />
        <Monitor
          x={1.1}
          z={0.5}
          ry={-0.15}
          screen={{
            kind: 'chrome',
            tabs: ['Change calendar', 'Runbook — web tier', 'Outlook', 'ITRM SEC-530'],
            url: 'confluence.parliament.ii/display/OPS/change-calendar',
            page: {
              brand: '#0f4c81',
              title: 'Change calendar — week of Sep 14',
              subtitle: '4 scheduled',
              rows: [
                'CHG-2291  Web tier patching        Wed 22:00  Approved',
                'CHG-2294  Certificate renewal      Thu 06:00  Approved',
                'CHG-2296  Load balancer firmware   Fri 21:00  Pending CAB',
                'CHG-2299  Elevator controller      —          Not our system',
              ],
            },
          }}
        />
        <Keyboard x={-0.2} z={-0.5} />
        <Pickable label="rubber rail"><Rail x={2.6} z={0.6} /></Pickable>
        <Pickable label="desk robot"><Robot x={-2.8} z={0.4} /></Pickable>
        <Pickable label="mug"><Mug x={-2.4} z={-0.5} material={mat.black} /></Pickable>
        {/*
          The almanac, face up by the keyboard. Turned a half-turn: a box's
          top face runs its texture toward local -Z, which is the side he sits
          on, so the cover read upside down from the chair.
        */}
        <Pickable label="the almanac">
          <group position={[1.5, 0, -0.55]} rotation={[0, Math.PI + 0.22, 0]}>
            <mesh position={[0, 0.055, 0]} material={pages}>
              <boxGeometry args={[0.82, 0.11, 1.08]} />
            </mesh>
            <mesh position={[0, 0.115, 0]} material={cover}>
              <boxGeometry args={[0.86, 0.02, 1.12]} />
            </mesh>
          </group>
        </Pickable>
      </Workstation>

      {/* server rack, moved up the west panel to leave his corner to the fan */}
      <Box size={[1.6, 3.4, 1.6]} material={mat.dark} position={[LX + 1.1, 1.7, -11.6]} collide />
      <StatusLights x={LX + 0.8} y={0.5} z={-10.79} />
      {/* the farm gate, framed on the west wall — the hackathon plaque used to
          hang here and the farm matters more to him than the award did */}
      <group position={[LX + 0.15, 4.6, -13]} rotation={[0, V, 0]}>
        <mesh material={frame} castShadow>
          <boxGeometry args={[2.5, 2.5, 0.09]} />
        </mesh>
        <Panel size={[2.24, 2.24]} material={farmPhoto} position={[0, 0, 0.05]} />
      </group>

      {/* the hen and her brood, framed, on the corridor panel — the one the
          way through is cut in — facing back into his bay */}
      <group position={[CL - 0.13, 4.4, -13]} rotation={[0, -V, 0]}>
        <mesh material={frame} castShadow>
          <boxGeometry args={[2.5, 2.5, 0.09]} />
        </mesh>
        <Panel size={[2.24, 2.24]} material={photo} position={[0, 0, 0.05]} />
      </group>
    </>
  )
}

/** Marcus — systems engineering, SW cubicle, desk against the west panel. */
function Marcus() {
  const figure = useMemo(() => M(0x8a44c8), [])
  /*
    The two notes stuck to his monitor bezel. Neither has worked yet: the
    terminal on his screen has three tabs open and the mail count is climbing.
  */
  const notes = useMemo(
    () =>
      (
        [
          [['READ ALL', 'EMAILS'], '#fff28a'],
          [['CLOSE', 'BROWSER TABS'], '#a8e8ff'],
        ] as const
      ).map(
        ([lines, colour]) =>
          new THREE.MeshStandardMaterial({
            map: stickyTex([...lines], colour),
            roughness: 0.9,
          }),
      ),
    [],
  )
  return (
    <>
      <Workstation x={LX + 1.5} z={1} ry={-V} w={6.5} d={2.6} chair={mat.blue}>
        {/*
          Five screens, which is four more than the standard issue.

          One pole off the back of the desk with two crossbars: three across
          at eye level and two above, wrapped into a C so every one of them
          faces the chair. Monitor turns by `ry + PI`, so the outer yaws are
          negative on the +X side — the sign that reads wrong is the right one.
          He put in a ticket for the fifth and it was approved by somebody who
          did not read it.
        */}
        <mesh position={[0, 1.75, 0.62]} material={mat.plastic}>
          <cylinderGeometry args={[0.07, 0.09, 3.5, 12]} />
        </mesh>
        <mesh position={[0, 0.06, 0.62]} material={mat.plastic}>
          <boxGeometry args={[0.7, 0.12, 0.5]} />
        </mesh>
        {[1.5, 3.05].map((by) => (
          <mesh key={by} position={[0, by, 0.62]} rotation={[0, 0, Math.PI / 2]} material={mat.plastic}>
            <cylinderGeometry args={[0.05, 0.05, by > 2 ? 3.6 : 6.0, 10]} />
          </mesh>
        ))}
        {(
          [
            [-2.65, 1.5, 0.42, -0.34, { kind: 'terminal', title: 'deploy — kse-staging',
              lines: ['$ ./deploy staging', '  build ✓  test ✓', '  sync 03:14 OK', '$ tail -f app.log', '  200 GET /api/roster', '$ '] }],
            [0, 1.5, 0.5, 0, { kind: 'terminal', title: 'deploy — kse-prod',
              lines: ['$ git log --oneline -3', 'a41f9c2 fix: sync window off by one', '9d3e118 chore: bump deps', '$ ./deploy prod', '  build ✓   test ✓   sync OK', '$ '] }],
            [2.65, 1.5, 0.42, 0.34, { kind: 'chrome', tabs: ['Jira', 'Grafana', 'Confluence', 'Outlook', '+9'],
              url: 'grafana.parliament.ii/d/kse/overview',
              page: { brand: '#1c3d8f', title: 'KSE — overview', subtitle: 'last 24h',
                rows: ['p95 latency      184 ms      ok', 'error rate      0.02 %      ok', 'sync lag          3 s       ok', 'queue depth        41       ok'] } }],
            [-1.35, 3.05, 0.42, -0.2, { kind: 'chrome', tabs: ['Outlook'], url: 'outlook.office.com/mail/inbox',
              page: { brand: '#0f6cbd', title: 'Inbox', subtitle: '1,204 unread',
                rows: ['Helpdesk    Ticket #4417 assigned to you', 'Priya       Re: sync window', 'All Staff   Fire drill Thursday', 'Chris       rack is up'] } }],
            [1.35, 3.05, 0.42, 0.2, { kind: 'chrome', tabs: ['Jira'], url: 'jira.parliament.ii/browse/KSE-812',
              page: { brand: '#1c6b52', title: 'KSE-812', subtitle: 'In progress',
                rows: ['Sync window off by one', 'Reported by  Priya', 'Assigned to  Marcus', 'Priority     Medium'] } }],
          ] as const
        ).map(([mx, my, mz, mry, screen], i) => (
          <Monitor key={i} x={mx} z={0.62 - mz} ry={mry} y={my} arm wide={i === 1} screen={screen as never} />
        ))}
        <Keyboard x={0} z={-0.5} />
        <StackPaper x={2.6} z={-0.2} n={14} />
        <Plant x={-2.8} z={-0.1} s={0.9} />
        {/* stuck to the near edge of the monitor, where he will not read them */}
        {notes.map((m, i) => (
          <Panel
            key={i}
            size={[0.52, 0.52]}
            material={m}
            position={[-1.02 + i * 2.04, 1.02, 0.32]}
            rotation={[0, 0, (i === 0 ? 1 : -1) * 0.06]}
          />
        ))}
        <Pickable label="little purple figure">
          <mesh position={[-2.2, 0.3, -0.3]} material={figure}>
            <coneGeometry args={[0.18, 0.6, 5]} />
          </mesh>
        </Pickable>
      </Workstation>
      <Box size={[1.4, 3, 1.4]} material={mat.laminate} position={[-1.3, 1.5, BZ - 0.85]} collide />
      <Plaque x={LX + 0.15} y={4.7} z={4} ry={V} lines={['10 YEARS', 'of Service', '2024']} />
    </>
  )
}

/** Priya — marketing, NE cubicle, desk on the east wall. */
function Priya() {
  /*
    Two Park Service posters on the corridor panel. She spends her weekends
    on the Skyline Drive and everybody on the floor has heard about it.
  */
  const parks = useMemo(
    () =>
      (['plateau', 'nightingale'] as const).map(
        (p) => new THREE.MeshStandardMaterial({ map: npsPosterTex(p), roughness: 0.85 }),
      ),
    [],
  )
  const balls = useMemo(
    () =>
      [
        [-2.0, -0.4, mat.green],
        [-2.3, -0.1, mat.yellow],
        [-1.7, -0.3, mat.red],
      ] as const,
    [],
  )
  return (
    <>
      <Workstation x={HALF - 1.6} z={-11.5} ry={V} w={6.5} d={2.6} chair={mat.red}>
        <Monitor
          x={0}
          z={0.5}
          ry={0}
          wide
          screen={{
            kind: 'chrome',
            tabs: ['Analytics — Q3', 'Campaign draft 7', 'Outlook', 'parliament.ii'],
            url: 'analytics.parliament.ii/reports/q3-outreach',
            page: {
              brand: '#7a2b6b',
              title: 'Q3 outreach — performance',
              subtitle: 'Last 30 days',
              rows: [
                'Open rate            31.4%      ▲ 2.1 pts',
                'Click-through        4.2%       ▼ 0.3 pts',
                'Unsubscribes         0.11%      flat',
                'Landing page views   18,204     ▲ 14%',
                'Deck due Friday. Draft 7 is not the last draft.',
              ],
            },
          }}
        />
        <Keyboard x={0} z={-0.5} />
        <Pickable label="mug"><Mug x={1.9} z={-0.6} material={mat.white} /></Pickable>
        <Pickable label="trophy"><Trophy x={-2.7} z={0.5} /></Pickable>
        <Pickable label="photo frame"><DeskFrame x={2.2} z={0.7} ry={-0.4} /></Pickable>
        {balls.map(([x, z, m], i) => (
          <Pickable key={i} label="stress ball">
            <mesh position={[x, 0.14, z]} material={m}>
              <sphereGeometry args={[0.14, 10, 8]} />
            </mesh>
          </Pickable>
        ))}
      </Workstation>
      {/*
        Two Park Service posters on the corridor panel she faces from her
        chair.
      */}
      {parks.map((m, i) => (
        <Panel
          key={i}
          size={[1.65, 2.42]}
          material={m}
          position={[CR + 0.13, 4.5, -10.4 - i * 2.0]}
          rotation={[0, V, (i === 1 ? -1 : 1) * 0.014]}
        />
      ))}

      <Plaque x={HALF - 0.15} y={5.2} z={-14} ry={-V} lines={['GOLD ADDY', 'Campaign of', 'the Year']} />
      <Plaque
        x={HALF - 0.15}
        y={4.0}
        z={-14}
        ry={-V}
        lines={['Employee of', 'the Month', 'MAR 2026']}
      />
    </>
  )
}

/** Jordan — marketing, SE cubicle, and a wallpaper side business. */
function Jordan() {
  const brass = useMemo(() => M(0xb9902f, { roughness: 0.35, metalness: 0.75 }), [])
  const bowl = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      }),
    [],
  )
  return (
    <>
      <Workstation x={12.5} z={BZ - 1.5} ry={0} w={6.5} d={2.6} chair={mat.red}>
        <Monitor
          x={-0.6}
          z={0.5}
          ry={0}
          wide
          screen={{
            kind: 'chrome',
            tabs: ['Content calendar', 'Night Garden — orders', 'Outlook', 'Canva'],
            url: 'sharepoint.parliament.ii/sites/comms/content-calendar',
            page: {
              brand: '#1c6b52',
              title: 'Content calendar — September',
              subtitle: '6 scheduled',
              rows: [
                'Mon 1   LinkedIn — IITS teaser          Draft',
                'Tue 2   Newsletter — September issue    Scheduled',
                'Wed 3   Blog — "Why we moved to T4"     In review',
                'Thu 4   —                               ',
                'Fri 5   Recap thread                    Not started',
              ],
            },
          }}
        />
        <Keyboard x={-0.6} z={-0.5} />
        <Pickable label="mug"><Mug x={2.2} z={-0.4} material={mat.blue} /></Pickable>
        <StackPaper x={-2.6} z={0.3} n={8} />
        <mesh position={[2.0, 0.1, 0.5]} material={bowl}>
          <cylinderGeometry args={[0.35, 0.25, 0.2, 16, 1, true]} />
        </mesh>
        <Pickable label="cactus">
          <mesh position={[-2.4, 0.4, -0.4]} scale={[1, 1.8, 1]} material={mat.green}>
            <sphereGeometry args={[0.12, 10, 8]} />
          </mesh>
        </Pickable>
        <mesh position={[-2.4, 0.12, -0.4]} material={mat.pot}>
          <cylinderGeometry args={[0.15, 0.12, 0.25, 10]} />
        </mesh>

        {/*
          The key to the safe in storage, on the desk under a sample book.

          Nobody remembers whose desk it was on before this one. Take it and
          it goes in your pocket rather than your hands — see Collectable.
        */}
        <Collectable
          id="safe-key"
          label="Small brass key"
          hint="A small brass key. Stamped 2301, which is the storage room."
        >
          <group position={[2.35, 0.12, -0.78]} rotation={[0, 0.7, 0]}>
            <mesh position={[0, -0.085, 0]} rotation={[Math.PI / 2, 0, 0]} material={brass}>
              <cylinderGeometry args={[0.019, 0.019, 0.3, 8]} />
            </mesh>
            <mesh position={[0, -0.085, -0.2]} material={brass}>
              <torusGeometry args={[0.055, 0.016, 6, 16]} />
            </mesh>
            {[0.11, 0.145].map((oz) => (
              <mesh key={oz} position={[0.035, -0.085, oz]} material={brass}>
                <boxGeometry args={[0.055, 0.016, 0.028]} />
              </mesh>
            ))}
          </group>
        </Collectable>
      </Workstation>
      <Plaque x={15.5} y={4.8} z={BZ - 0.15} ry={Math.PI} lines={['TEAM PLAYER', 'Q1 2026']} />
    </>
  )
}

/** Denise — service desk, NW bay of the wing, under the window. */
function Denise() {
  /*
    She is the floor's accessibility person as well as the service desk, so
    the panel behind her is the contrast card, the alt-text rules and the
    pledge poster rather than anything of her own.
  */
  const a11y = useMemo(
    () =>
      (['wcag', 'alt', 'ally'] as const).map(
        (k) => new THREE.MeshStandardMaterial({ map: a11yPosterTex(k), roughness: 0.8 }),
      ),
    [],
  )
  const diploma = useMemo(
    () => new THREE.MeshStandardMaterial({ map: diplomaTex(), roughness: 0.55 }),
    [],
  )
  const frameMat = useMemo(() => M(0x2f2a22, { roughness: 0.5 }), [])
  const matBoard = useMemo(() => M(0xe9e4d6, { roughness: 0.9 }), [])
  const thesisCover = useMemo(
    () => new THREE.MeshStandardMaterial({ map: thesisCoverTex(), roughness: 0.5 }),
    [],
  )
  return (
    <>
      <Workstation x={25} z={-16.4} ry={Math.PI} w={6.5} d={2.6} chair={mat.black}>
        <Monitor
          x={-1.3}
          z={0.5}
          ry={0}
          screen={{
            kind: 'chrome',
            tabs: ['VCCC — my queue', 'Knowledge base', 'Outlook', 'Teams'],
            url: 'help.parliament.ii/queue/mine',
            page: {
              brand: '#0f4c81',
              title: 'My queue — 14 open',
              subtitle: '3 breaching',
              rows: [
                '#8812  Printer offline — 23rd floor      High',
                '#8814  Password reset                    Low',
                '#8815  VPN drops every 20 minutes        High',
                '#8819  No heat, 23rd floor               Med',
                '#8821  "Computer makes a noise"          Low',
              ],
            },
          }}
        />
        <Monitor
          x={1.1}
          z={0.5}
          ry={-0.15}
          screen={{
            kind: 'outlook',
            folder: 'Tickets',
            unread: 61,
            mail: [
              { from: 'VCCC (auto)', subject: 'INC0084519 — VPN drops every 20 minutes', time: '2:44 PM', unread: true, flagged: true },
              { from: 'VCCC (auto)', subject: 'INC0084517 — printer offline, 23rd floor', time: '2:12 PM', unread: true },
              { from: 'Chris Lane Jones', subject: 'Re: the big printer — it is a driver thing', time: '1:30 PM', unread: true },
              { from: 'VCCC (auto)', subject: 'INC0084503 — resolved', time: '11:47 AM' },
              { from: 'Facilities', subject: 'RE: no heat, 23rd floor', time: '9:20 AM' },
              { from: 'Ray Butler', subject: 'ap-23-4 is flapping again', time: 'Wed' },
            ],
          }}
        />
        <Keyboard x={-0.2} z={-0.5} />
        <Pickable label="mug"><Mug x={-2.4} z={-0.5} material={mat.blue} /></Pickable>
        <Plant x={2.6} z={0.5} s={0.85} />
        {/*
          Her own dissertation, stood up where she can hand it to people.
          Turned a half-turn: the cover faced the window and the page block
          faced the room, so from the aisle it was a blank white slab.
        */}
        <Pickable label="dissertation">
          <group position={[2.05, 0.55, -0.55]} rotation={[0, Math.PI - 0.42, 0]}>
            <mesh material={thesisCover} castShadow>
              <boxGeometry args={[0.75, 1.05, 0.16]} />
            </mesh>
            <mesh position={[0, 0, -0.085]} material={mat.page}>
              <boxGeometry args={[0.71, 1.01, 0.02]} />
            </mesh>
          </group>
        </Pickable>
      </Workstation>
      {/*
        North of the poster run, not across it: the posters reach z -12.68 and
        the plaque is 1.1 wide, so at -13 the two overlapped by nearly three
        inches and the plaque's back face sat behind the pledge card's plane.
      */}
      <Plaque x={LX2 + 0.15} y={4.6} z={-13.7} ry={V} lines={['SERVICE STAR', 'Q4 2025']} />

      {/*
        Her master's, framed, on the corridor panel rather than over the
        posters — on the west wall it sat across the pledge poster and the
        service plaque, and all three were fighting for the same three feet.
      */}
      <group position={[CL2 - 0.2, 5.2, -12.4]} rotation={[0, -V, 0]}>
        <Box size={[2.9, 2.3, 0.09]} material={frameMat} position={[0, 0, -0.03]} />
        <Box size={[2.66, 2.06, 0.03]} material={matBoard} position={[0, 0, 0.03]} cast={false} />
        <Panel size={[2.3, 1.75]} material={diploma} position={[0, 0, 0.05]} />
      </group>

      {/* the three posters, on the west panel of her bay */}
      {a11y.map((m, i) => (
        <Panel
          key={i}
          size={[1.35, 1.77]}
          material={m}
          position={[LX2 + 0.13, 4.55, -8.6 - i * 1.7]}
          rotation={[0, V, (i - 1) * 0.012]}
        />
      ))}
    </>
  )
}

/** Ray — network operations, SW bay of the wing. */
function Ray() {
  const spool = useMemo(() => M(0x2b63c9), [])
  const texas = useMemo(
    () => new THREE.MeshStandardMaterial({ map: texasTex(), roughness: 0.9 }),
    [],
  )
  return (
    <>
      <Workstation x={LX2 + 1.5} z={1} ry={-V} w={6.5} d={2.6} chair={mat.blue}>
        <Monitor
          x={0}
          z={0.5}
          ry={0}
          wide
          screen={{
            kind: 'terminal',
            title: 'fl23-idf-a — console',
            lines: [
              '$ show interfaces status | i notconnect',
              'Gi1/0/14   notconnect  auto  auto',
              '$ show ap summary | i 23-4',
              'ap-23-4  10.23.4.11  DOWN  (flap x9)',
              '$ ping ap-23-4',
              'Request timeout for icmp_seq 0',
            ],
          }}
        />
        <Keyboard x={0} z={-0.5} />
        <StackPaper x={2.3} z={0.4} n={10} />
        <Pickable label="mug"><Mug x={-2.2} z={-0.5} material={mat.black} /></Pickable>
        <Pickable label="cable spool">
          <mesh position={[-2.4, 0.12, 0.5]} rotation={[Math.PI / 2, 0, 0]} material={spool}>
            <torusGeometry args={[0.45, 0.1, 8, 24]} />
          </mesh>
        </Pickable>
      </Workstation>
      <Box size={[1.6, 3.4, 1.6]} material={mat.dark} position={[LX2 + 1.3, 1.7, BZ2 - 1.2]} collide />
      <StatusLights x={LX2 + 1.0} y={0.5} z={BZ2 - 2.01} />

      {/* the pennant, pinned to the corridor panel above the rack */}
      <Panel
        size={[2.5, 1.55]}
        material={texas}
        position={[CL2 - 0.13, 5.5, 3.4]}
        rotation={[0, -V, 0.02]}
      />
    </>
  )
}

/**
 * Chris — Linux hacker, SE bay of the wing.
 *
 * Three ultrawides on one pole, all of them Arch terminals, and his own
 * rack under the corridor panel: a full-height cabinet with a switch and
 * four nodes in it, humming to itself. The desk is otherwise bare, which
 * is the point.
 */
function Chris() {
  const rackFace = useMemo(() => M(0x14161a, { roughness: 0.5, metalness: 0.4 }), [])
  const rail = useMemo(() => M(0x3a3f46, { roughness: 0.4, metalness: 0.7 }), [])
  /*
    The left panel is the hall's camera feed, live off the same render target
    the screens downstairs use — he keeps the keynote up while he works.
  */
  const stage = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: FEED.texture,
        emissiveMap: FEED.texture,
        emissive: 0xffffff,
        emissiveIntensity: 0.9,
        color: 0x000000,
        roughness: 0.15,
      }),
    [],
  )
  return (
    <>
      <Workstation x={41.5} z={BZ2 - 1.5} ry={0} w={6.5} d={2.6} chair={mat.black}>
        {/* one pole, one crossbar, two 43-inch panels either side of it */}
        <mesh position={[0, 1.7, 0.75]} material={mat.plastic}>
          <cylinderGeometry args={[0.07, 0.09, 3.4, 12]} />
        </mesh>
        <mesh position={[0, 0.06, 0.75]} material={mat.plastic}>
          <boxGeometry args={[0.8, 0.12, 0.55]} />
        </mesh>
        <mesh position={[0, 2.1, 0.75]} rotation={[0, 0, Math.PI / 2]} material={mat.plastic}>
          <cylinderGeometry args={[0.05, 0.05, 4.4, 10]} />
        </mesh>
        {/*
          House left: the stage, on a bare panel of its own so the feed fills
          it. Both panels toe in toward the chair — the yaws used to run the
          other way and the pair splayed open, so from the seat you were
          looking at the two of them edge-on.
        */}
        <group position={[-2.1, 2.1, 0.42]} rotation={[0, Math.PI - 0.26, 0]}>
          <mesh position={[0, 0, -0.12]} material={mat.plastic}>
            <boxGeometry args={[3.2, 1.6, 0.18]} />
          </mesh>
          <mesh material={useMemo(() => M(0x1a1b1e, { roughness: 0.35 }), [])}>
            <boxGeometry args={[4.1, 2.1, 0.06]} />
          </mesh>
          <Panel size={[3.95, 1.95]} material={stage} position={[0, 0, 0.032]} />
        </group>
        <Monitor
          x={2.1}
          z={0.33}
          ry={0.26}
          y={2.1}
          arm
          big
          screen={{
            kind: 'terminal',
            title: 'chris@arch — tmux: main',
            lines: [
              '$ uname -srm',
              'Linux 6.12.4-arch1-1 x86_64',
              '$ pacman -Syu',
              ':: Synchronizing package databases...',
              ':: Proceed with installation? [Y/n] ',
              '$ ',
            ],
          }}
        />
        <Keyboard x={0} z={-0.5} />
        <Pickable label="mug"><Mug x={-2.5} z={-0.4} material={mat.black} /></Pickable>
      </Workstation>

      {/*
        His rack, back against the corridor panel and out of the desk's way:
        a cabinet with a vented door, a switch at the top and five nodes under
        it, each with its own lights.
      */}
      <Box size={[1.8, 6.2, 2.0]} material={rackFace} position={[CR2 + 1.05, 3.1, BZ2 - 3.4]} collide />
      {[-1, 1].map((s) => (
        <Box
          key={s}
          size={[0.08, 6.0, 0.1]}
          material={rail}
          position={[CR2 + 1.05 + s * 0.7, 3.1, BZ2 - 4.41]}
          cast={false}
        />
      ))}
      {[5.5, 4.7, 3.9, 3.1, 2.3, 1.5].map((y, i) => (
        <group key={y}>
          <Box
            size={[1.5, i === 0 ? 0.4 : 0.62, 0.06]}
            material={rail}
            position={[CR2 + 1.05, y, BZ2 - 4.42]}
            cast={false}
          />
          <StatusLights x={CR2 + 1.05} y={y - 0.2} z={BZ2 - 4.45} n={8} ry={Math.PI} />
        </group>
      ))}
    </>
  )
}

/**
 * The bay to Chris's left, in the strip that came off the closet.
 *
 * The desk backs onto the panel at BX2, which is the same panel Chris's bay
 * is the other side of — the two of them sit back to back with a panel and
 * seven feet between. The chair is toward the doorway, so whoever it is has
 * the walkway behind them and the closet wall past that.
 *
 * Whose desk it is has not been settled, so there is no nameplate on the
 * panel yet and the screen is the intranet rather than anybody's mail.
 */
/** Half-section of the volcano, turned on a lathe: steep top, crater dip. */
const PEAK_PROFILE = [
  [0.3, 0],
  [0.26, 0.035],
  [0.2, 0.095],
  [0.13, 0.19],
  [0.075, 0.28],
  [0.048, 0.33],
  [0.034, 0.326],
  [0, 0.316],
].map(([r, y]) => new THREE.Vector2(r, y))

/** The snow cap: the same slope from two-thirds up, a hair proud of the rock. */
const SNOW_PROFILE = [
  [0.108, 0.24],
  [0.079, 0.283],
  [0.052, 0.334],
  [0.037, 0.33],
  [0, 0.32],
].map(([r, y]) => new THREE.Vector2(r, y))

/**
 * Queen Mary's Peak, the volcano Tristan da Cunha is built round, as a desk
 * model: a turned cone on a painted sea, snow on the summit and the crater
 * lake in the top. Every new starter gets one; this one is still in the
 * spot the welcome pack put it.
 */
function QueenMarysPeak({ x, z, ry = 0 }: { x: number; z: number; ry?: number }) {
  const peak = useMemo(() => new THREE.LatheGeometry(PEAK_PROFILE, 28), [])
  const snow = useMemo(() => new THREE.LatheGeometry(SNOW_PROFILE, 28), [])
  const rock = useMemo(() => M(0x5d6b45, { roughness: 0.9 }), [])
  const white = useMemo(() => M(0xf4f6f8, { roughness: 0.6 }), [])
  const sea = useMemo(() => M(0x2c5d8f, { roughness: 0.4 }), [])
  const lake = useMemo(() => M(0x3f7fb0, { roughness: 0.15 }), [])
  const wood = useMemo(() => M(0x6b4a2b, { roughness: 0.7 }), [])
  const label = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ map: peakLabelTex(), roughness: 0.35, metalness: 0.6 }),
    [],
  )

  return (
    <Pickable label="Queen Mary's Peak">
      <group position={[x, 0, z]} rotation={[0, ry, 0]}>
        <mesh position={[0, 0.04, 0]} material={wood} castShadow receiveShadow>
          <boxGeometry args={[0.72, 0.08, 0.5]} />
        </mesh>
        <mesh position={[0, 0.082, 0]} rotation={[-Math.PI / 2, 0, 0]} material={sea}>
          <planeGeometry args={[0.68, 0.46]} />
        </mesh>
        <mesh geometry={peak} material={rock} position={[0, 0.08, 0]} castShadow />
        <mesh geometry={snow} material={white} position={[0, 0.08, 0]} />
        <mesh position={[0, 0.08 + 0.327, 0]} rotation={[-Math.PI / 2, 0, 0]} material={lake}>
          <circleGeometry args={[0.028, 16]} />
        </mesh>
        {/* the brass label on the front edge of the plinth */}
        <mesh position={[0, 0.04, -0.252]} rotation={[0, Math.PI, 0]} material={label}>
          <planeGeometry args={[0.48, 0.07]} />
        </mesh>
      </group>
    </Pickable>
  )
}

function Newcomer() {
  return (
    <Workstation x={BX2 + 1.5} z={1} ry={-V} w={6.5} d={2.6} chair={mat.blue}>
      <Monitor
        x={0}
        z={0.5}
        ry={0}
        wide
        screen={{
          kind: 'chrome',
          tabs: ['Parliament intranet', 'Knowledge base', 'Outlook'],
          url: 'intranet.parliament.ii/welcome',
          page: {
            brand: '#0f4c81',
            title: 'Welcome to Parliament',
            subtitle: 'New starter — first week',
            rows: [
              'Set up your help desk account           Not started',
              'Badge and building access               Not started',
              'Security awareness training             Not started',
              'Meet your team — 23rd floor, Suite 2300 Not started',
            ],
          },
        }}
      />
      <Keyboard x={0} z={-0.5} />
      <Pickable label="mug"><Mug x={2.4} z={-0.4} material={mat.blue} /></Pickable>
      <Plant x={-2.6} z={0.4} s={0.85} />
      <QueenMarysPeak x={2.35} z={0.55} ry={0.3} />
    </Workstation>
  )
}

/** Everyone's desk, and the greenery between them. */
export function Workstations() {
  return (
    <>
      <James />
      <Marcus />
      <Priya />
      <Jordan />
      <Denise />
      <Ray />
      <Chris />
      <Newcomer />

      {/*
        A floor fan in the corner of every occupied bay, aimed at whoever sits
        there.

        Each one is 1.45 ft off both panel lines, which is as far into the
        corner as a 2.6 ft guard goes. Three bays had something in the corner
        already and it moved: Ava's server rack up the west panel, Marcus's
        record crate under the record wall, Jordan's dog bed out into the bay.
        Priya's is off the knee wall rather than the panel line — the sill
        projects a foot into the room under the glass.

        The eighth bay is records storage and gets the old desk fan instead —
        see RecordsBay. The tenth is block three's back bay, which is empty and
        gets nothing. Nothing in this list is in the storage room.
      */}
      {(
        [
          [-9.05, -6.95, 2.64],
          [-9.05, 5.57, 2.57],
          [7.95, -16.3, 0.83],
          [16.44, -4.05, -0.54],
          [LX2 + 1.45, -6.95, 2.71],
          [28.05, 5.55, -2.53],
          [44.55, -4.05, -0.43],
          [EX3 - 1.45, DZ3 + 1.45, -0.32],
        ] as const
      ).map(([x, z, ry]) => (
        <FloorFan key={`${x}:${z}`} x={x} z={z} ry={ry} />
      ))}

      {/* SHIP IT. poster on the corridor wall of the marketing side */}
      <Plant x={HALF - 1.2} z={0} s={2.4} />
      <Plant x={LX + 1.2} z={DZ + 1.5} s={2.0} />
      <Plant x={CR - 6.5 - 1.5} z={BZ + 1.3} s={2.2} />
      <Plant x={CR + 1.5} z={BZ + 1.3} s={2.2} />
      <Plant x={BX2 - 1.5} z={2} s={2.4} />

      {/* the spare chair that lives in the aisle, under the foam blaster */}
      <Chair x={-14} z={11} ry={1.9} seat={mat.black} />
    </>
  )
}
