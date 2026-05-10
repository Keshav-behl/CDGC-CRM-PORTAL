/**
 * seedUsers.js — Run once to create all user accounts in Firestore.
 *
 * Usage:
 *   node scripts/seedUsers.js
 *
 * Requires: .env file with your VITE_FIREBASE_* variables.
 *
 * To ADD a new user later:
 *   1. Add an entry to the USERS array below.
 *   2. Run: node scripts/seedUsers.js
 *   (Existing users are overwritten only if you change them here.)
 *
 * To CHANGE a password:
 *   - Use the Admin dashboard → Users → Reset pwd
 *   - OR update the password field here and re-run the script.
 *
 * To REMOVE a user:
 *   - Use the Admin dashboard → Users → delete icon
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc } from 'firebase/firestore'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

// Parse .env manually (no dotenv dependency needed)
function loadEnv() {
  try {
    return Object.fromEntries(
      readFileSync('.env', 'utf8')
        .split('\n')
        .filter(l => l.includes('=') && !l.trim().startsWith('#'))
        .map(l => {
          const idx = l.indexOf('=')
          return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]
        })
    )
  } catch {
    console.error('Could not read .env file. Make sure you run this from the project root.')
    process.exit(1)
  }
}

function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex')
}

// ─── USER LIST ───────────────────────────────────────────────────────────────
// username   = what they type at login (case-sensitive)
// displayName = shown in the UI
// password   = first 3 letters of name + 4 digits (generated below)
// role       = 'user' or 'admin'
//
// TO ADD A USER: copy one of the rows, fill in the details, run the script.
// ─────────────────────────────────────────────────────────────────────────────
const USERS = [
  { username: 'KESHAV',      displayName: 'Keshav',       password: 'KES7342',       role: 'user'  },
  { username: 'MANIT',       displayName: 'Manit',        password: 'MAN5819',       role: 'user'  },
  { username: 'PIYUSH',      displayName: 'Piyush',       password: 'PIY2647',       role: 'user'  },
  { username: 'RAYAN',       displayName: 'Rayan',        password: 'RAY9153',       role: 'user'  },
  { username: 'DIVESH',      displayName: 'Divesh',       password: 'DIV4826',       role: 'user'  },
  { username: 'NANDIKA',     displayName: 'Nandika',      password: 'NAN3571',       role: 'user'  },
  { username: 'HEAD_CDGC',   displayName: 'Head CDGC',    password: 'HEA6294',       role: 'user'  },
  { username: 'Keshav_admin', displayName: 'Keshav (Admin)', password: 'admincdgc2026', role: 'admin' },
]

async function seed() {
  const env = loadEnv()

  const firebaseConfig = {
    apiKey:            env.VITE_FIREBASE_API_KEY,
    authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:         env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:             env.VITE_FIREBASE_APP_ID,
  }

  if (!firebaseConfig.projectId) {
    console.error('VITE_FIREBASE_PROJECT_ID not found in .env')
    process.exit(1)
  }

  const app = initializeApp(firebaseConfig)
  const db = getFirestore(app)

  console.log(`\nSeeding ${USERS.length} users to project "${firebaseConfig.projectId}"...\n`)

  for (const user of USERS) {
    const passwordHash = hashPassword(user.password)
    await setDoc(doc(db, 'users', user.username), {
      username:     user.username,
      displayName:  user.displayName,
      passwordHash,
      role:         user.role,
    })
    const masked = user.password.slice(0, 3) + '****'
    console.log(`  ✓  ${user.username.padEnd(18)} ${masked.padEnd(12)} [${user.role}]`)
  }

  console.log('\n✅  All users seeded successfully!\n')
  console.log('──────────────────────────────────────────')
  console.log('CREDENTIALS (share securely — not via git)')
  console.log('──────────────────────────────────────────')
  USERS.filter(u => u.role === 'user').forEach(u => {
    console.log(`  ${u.username.padEnd(14)} ${u.password}`)
  })
  console.log(`\n  ${'Keshav_admin'.padEnd(14)} admincdgc2026  [ADMIN]`)
  console.log('──────────────────────────────────────────\n')

  process.exit(0)
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
