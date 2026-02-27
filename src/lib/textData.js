// ── Text & word generation ──────────────────────────

const WORDS = `the be to of and a in that have it for not on with he as you do at this
but his by from they we say her she or an will my one all would there their what
so up out if about who get which go me when make can like time no just him know
take people into year your good some could them see other than then now look only
come its over think also back after use two how our work first well way even new
want because any these give day most us find long down did life may part place
world still old big real end put home read hand land large add light kind off need
house picture try again animal point play small number always move side stand own
above while both near build self earth head page should country found answer school
grow study learn plant cover food sun four between state keep eye never last let
thought city tree cross farm hard start might story saw far sea draw left late run
while press close night few north open door cut sure watch color face wood main
open seem together next white children begin got walk example ease paper group
always music those both mark book letter until mile river car feet care second
enough plain girl usual young ready above ever red list though feel talk bird soon
body dog family direct pose leave song measure door product black short numeral
once class wind question happen complete ship area half rock fire south problem
piece told knew pass since top whole king space heard best hour better true during`.split(/\s+/).filter(Boolean)

const ADVANCED = `algorithm abstract function variable constant implementation iteration recursion
polymorphism encapsulation inheritance interface prototype constructor asynchronous
synchronous middleware framework architecture repository dependency authentication
authorization configuration environment deployment infrastructure integration
validation performance optimization refactoring debugging documentation persistence
transaction concurrency parallelism abstraction components containers orchestration
microservices distributed eventual consistency idempotent immutable functional
declarative imperative reactive observable promise callback closure generator
iterator protocol serialization deserialization normalization denormalization`.split(/\s+/).filter(Boolean)

const QUOTES = [
  "the only way to do great work is to love what you do if you haven't found it yet keep looking don't settle",
  "in the middle of every difficulty lies opportunity the measure of intelligence is the ability to change",
  "first solve the problem then write the code any fool can write code that a computer can understand good programmers write code that humans can understand",
  "programs must be written for people to read and only incidentally for machines to execute",
  "simplicity is prerequisite for reliability the art of programming is the art of organizing complexity",
  "the best error message is the one that never shows up make it work make it right make it fast",
  "code is like humor when you have to explain it it's bad writing software is about managing complexity",
  "talk is cheap show me the code before software can be reusable it first has to be usable",
  "every great developer you know got there by solving problems they were unqualified to solve until they did it",
  "there are only two hard things in computer science cache invalidation and naming things",
  "debugging is twice as hard as writing the code in the first place therefore if you write the code as cleverly as possible you are by definition not smart enough to debug it",
  "the function of good software is to make the complex appear to be simple",
  "walking on water and developing software from a specification are easy if both are frozen",
]

const CODE = [
  "const fibonacci = n => n <= 1 ? n : fibonacci ( n - 1 ) + fibonacci ( n - 2 ) ;",
  "function debounce ( fn , delay ) { let t ; return ( ...args ) => { clearTimeout ( t ) ; t = setTimeout ( ( ) => fn ( ...args ) , delay ) ; } ; }",
  "const flatten = arr => arr . reduce ( ( acc , val ) => acc . concat ( Array . isArray ( val ) ? flatten ( val ) : val ) , [ ] ) ;",
  "async function fetchUser ( id ) { const res = await fetch ( `/users/${id}` ) ; if ( ! res . ok ) throw new Error ( res . status ) ; return res . json ( ) ; }",
  "const memoize = fn => { const cache = new Map ( ) ; return ( ...args ) => { const key = JSON . stringify ( args ) ; return cache . has ( key ) ? cache . get ( key ) : cache . set ( key , fn ( ...args ) ) . get ( key ) ; } ; } ;",
]

const RUSH_POOL = `box cat dog fix fog hot job key law map net oil pan red run sea tax use van war
back ball band base bath bear beat been bell belt best bill bird bite blue boat
bold bolt book boot born both burn busy byte call calm came care cart cash cast
cave cell cent chip city clay coal coat code coin cold cool copy core corn cost
curl dark data date dead deck deep deny desk dirt disk dive door dose down drag
draw drum dust each earn edge epic face fact fail fall fame farm fast fate feed
feel fill film find fire fish flag flat flip flow fold font food form free fuel
full gain gate gear gift give glad glow gold good grab gray grid grip grow gulf
halt hang hard harm hate have head hear heat help hero high hill hint hold hole
hook hope horn huge hunt inch iron join jump just keep kick kill kind kiss know
land last late lead lean left lend less lift like line link list live load lock
long loop lose luck mail main mark mass math maze mean meet melt mind mine mint
miss mode mood moon move much must name near neck need news next nice nine node
none note once only open pace pack page paid pain pale palm park part pass path
peak pick pile pine ping pink pipe plan play plot plug plus poll pool port post
pour pull pump push quit race rack rain rank rate read real rent rest rice rich
ride ring rise risk road rock role roll roof room root rose rule rush safe sail
sake sale salt same sand save scan seal self sell send ship shop shot show sick
sign silk site size skin skip slam slim slip slow snap snow soft soil sole song
soon sort soul span spin spot star stay stem step stop such swim sync tail tall
tank task team tear tell tend tent term test text tick tile time tiny tire toll
tool torn tour town trap tree trim trip true tube tune turn type unit user view
vote walk wall warm warn wave weak wear week well west when wide will wind wine
wing wire wish wood word work wrap yarn year zero zone`.split(/\s+/).filter(Boolean)

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function generate({ mode = 'words', dur = 30, punct = false, nums = false, custom = '' } = {}) {
  if (mode === 'custom' && custom.trim()) return custom.trim().split(/\s+/).filter(Boolean)
  if (mode === 'quotes') return QUOTES[Math.floor(Math.random() * QUOTES.length)].split(' ')
  if (mode === 'code')   return CODE[Math.floor(Math.random() * CODE.length)].split(' ')

  const bank = [...WORDS, ...ADVANCED.slice(0, 20)]
  const count = Math.max(50, dur * 3)
  const out = []
  for (let i = 0; i < count; i++) {
    let w = bank[Math.floor(Math.random() * bank.length)]
    if (nums   && Math.random() < 0.12) w = String(Math.floor(Math.random() * 999) + 1)
    if (punct  && Math.random() < 0.22) w += [',', '.', ';', '!', '?'][Math.floor(Math.random() * 5)]
    out.push(w)
  }
  return out
}

export function getRushWords(count = 300) {
  const pool = shuffle(RUSH_POOL)
  const result = []
  while (result.length < count) result.push(...pool)
  return result.slice(0, count)
}

