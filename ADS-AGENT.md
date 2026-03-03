How To Run Your Meta Ads With Openclaw
This is automated Meta ads management running on @Openclaw.
Matthew Berman
@TheMattBerman
·
Feb 26
I run my meta ads with 
@openclaw
 for $0/month 😱

here's the system that runs autonomously:

step 1: daily health check
→ social-cli (major shoutout to 
@vishalojha_me
) wraps 
@Meta
's marketing API (token refresh, pagination, rate limits all handled)
→ am I on track? what's
Show more
0:08 / 0:36
Every morning (or every few hours depending on the account) I get a Telegram message like this:
Paused Retargeting_V3_Feb. CPA $87 against $35 target, three straight days. Creative fatigue confirmed. Shifted $47/day to Founder_Hook_V2. That one's at 1.8x ROAS and climbing. Also: generated 4 new ad variants from your top performer and uploaded them to the February_Prospecting campaign. Ready for your review.
I read it. I apply approved. And the agent takes charge.
That's an @openclaw agent running in my ad account right now. Open source. Free.
Let me show you exactly how it works, including the thresholds, the commands, the architecture, and the stuff I got wrong.
THE WHOLE THING IS OPEN SOURCE GET IT HERE:
https://github.com/TheMattBerman/meta-ads-kit
Part 1: The Problem
I've been running Meta ads for 20 years. Scaled Fireball Whisky from one state to a billion dollar global brand. Ran campaigns for folks like Heineken, Hennessy, Delano and others. Managed millions in ad spend across hundreds of accounts.
And every single morning of those 20 years, the routine was the same.
Open Ads Manager. Wait for it to load (always slow). Click into campaigns. Rearrange columns because it never remembers your view. Check spend pacing. Click into ad sets. Check CPAs. Click into ads. Sort by CTR. Find the one that's bleeding. Find the one that's winning. Wonder if that CTR drop is noise or fatigue. Check frequency. Go back to campaigns. Adjust a budget. Repeat.
20 minutes minimum. Every day. Before you've done any actual thinking.
Here's the thing that finally broke me: the patterns I'm looking for are always the same. Every single morning I'm asking the same five questions:
Am I on track with spend?
What's actually running?
How's performance trending?
Who's winning and who's losing?
Any signs of fatigue?
That's it. Five questions. The same five questions for 20 years.
The moment I realized the pattern recognition was mechanical, I knew an agent could do it. Not a dashboard. Not a report. An agent that asks the questions, interprets the answers, and takes action on the obvious stuff without waiting for me to click through 47 screens.
To be clear: no AI agent is replacing a killer media buyer who's running strategy, testing new angles, understanding your customer. This is best used in two areas: 1) before you hire that person and are managing spend yourself, 2) giving your media buyer superpowers so they spend time on strategy instead of clicking.
Part 2: The Stack
Here's what's running. Every piece is open source or free tier (you're still paying for LLMs or your own electricity if you're running local guys)
First get social-cli. The connection to Meta. Open source CLI by @vishalgojha that wraps Meta's Marketing API. Handles token refresh, pagination, rate limits. All the stuff that makes the Graph API miserable to work with directly.
Get it here: https://github.com/vishalgojha/social-flow
Meta Marketing API. Where the data lives. social-cli talks to it. The agent never touches it directly.
┌───────────────────────────────────────────────────────────────────┐
│                     META ADS COPILOT PIPELINE                      │
└───────────────────────────────────────────────────────────────────┘

  ┌──────────┐    ┌──────────┐    ┌──────────┐
  │  MONITOR │───▶│  DETECT  │───▶│  BUDGET  │
  │ 5 daily  │    │ fatigue  │    │ optimize │
  │ questions│    │ bleeders │    │ shift $  │
  └──────────┘    └──────────┘    └──────────┘
                                       │
       ┌───────────────────────────────┘
       ▼
  ┌──────────┐    ┌──────────┐
  │  WRITE   │───▶│  UPLOAD  │───▶  Back to MONITOR
  │ new copy │    │ to Meta  │
  │ per image│    │ Graph API│
  └──────────┘    └──────────┘

  Monitor → Detect → Optimize → Write New Ads → Upload → Repeat
  No Ads Manager at any step.
@openclaw: The brain. Open-source framework for running AI agents. Not chatbots. Persistent agents that read files, call APIs, run on schedules, and actually do things. Each "skill" is a module with one job. The agent knows how to use them together. It runs 24/7 on a cron schedule whether I'm awake or not.
Five skills. The knowledge layer. Each one teaches the agent a different part of paid media management.
meta-ads — runs the 5 daily questions, handles pause/resume/budget actions
ad-creative-monitor — tracks creative health over time, catches fatigue before your CPA spikes
budget-optimizer — ranks campaign efficiency, recommends where to shift spend
ad-copy-generator — writes ad copy matched to your specific image creatives, informed by what's already converting in your account
ad-upload — pushes new ads straight to Meta via Graph API. Image, copy, everything. No Ads Manager.
Total monthly cost: $0. OpenClaw is open source. social-cli is open source. The skills are open source. Meta's API is free. The only cost is the AI model the agent runs on, and if you're already paying for Claude or GPT, that's covered.
Part 3: The 5 Daily Questions
This is the core. Five questions that replace 20 minutes of Ads Manager clicking.
The agent runs these every morning at 7am via cron. Here's what each one does and the actual commands behind them.
Question 1: Am I on track?
social marketing status
Checks spend pacing against daily budget. If you're 60% through the day with 20% of budget spent, something's throttling delivery. If you're blowing through budget by noon, your frequency caps might be wrong or a broad audience is eating spend. The agent flags both.
Question 2: What's running?
social marketing campaigns --status ACTIVE
Pulls all active campaigns with status. You'd be surprised how often what you think is running and what's actually running don't match. Paused campaigns you forgot about. Active campaigns from a test you never turned off.
Question 3: How's performance?
social marketing insights --preset last_7d --level campaign
Seven day metrics by campaign. ROAS, CPA, CPL, CTR. Sorted by what matters. Not buried in Ads Manager columns you have to rearrange every single time.
Question 4: Who's winning and who's losing?
social marketing insights --preset last_7d --level ad \
  --fields "ad_name,spend,impressions,clicks,ctr,cpc,actions,cost_per_action_type"
Ad level data, ranked. Best to worst. Winners are obvious. So are the ones bleeding money.
Question 5: Any fatigue?
social marketing insights --preset last_7d --level ad \
  --time-increment 1 --fields "ad_name,impressions,ctr,cpc,frequency"
Daily breakdown by ad. CTR trending down day over day. Frequency climbing past 3. CPC rising without an obvious cause. These are early signals of creative fatigue. By the time your CPA spikes, you've already wasted a week of budget.
The agent runs all five in sequence. Interprets the data. Builds a morning brief. Sends it to Telegram before I've finished my first cup of coffee.
Five questions. Five commands. That's the whole core.
And honestly I don't remember the commands. I just tell Openclaw to run the sequence for me. 
Part 4: Catching Dying Ads
Not all underperformers are obvious. Some ads die slowly. The agent watches for three specific signals and auto-pauses when the evidence is clear.
The thresholds:
When one condition triggers, the agent flags it as a "watch." When two or more trigger simultaneously, it auto-pauses and notifies me.
Here's what a bleeder looks like:
⚠️  Retargeting_V3_Feb
   Campaign: February_Retargeting
   Spend: $412  |  CTR: 0.7%  |  CPC: $3.82  |  Freq: 4.1
   CPA: $87 vs $35 target (2.5x for 72 hours)
   → AUTO-PAUSED. Saved ~$120/day.
That $412 was already gone. But the $120/day going forward? Saved while I slept.
The pause command is one line:
social marketing pause ad 24851234567890
The 48 hour rule matters. One bad day can be noise. Day of week effects. A holiday. iOS weirdness. Two days of consistent underperformance against a 2.5x CPA threshold is not noise. That's a pattern. I learned this after I killed a perfectly good ad based on 18 hours of noisy data. Bad days happen. Bad trends are different.
Part 5: Creative Fatigue Detection
Creative fatigue is the silent killer. Your ad looked great on Monday. By Friday the audience has trained themselves to ignore it. The metrics tell the story if you know where to look.
The math: day over day CTR.
Day 1: 2.8%
Day 2: 2.6%
Day 3: 2.4%
Day 4: 2.1%
Day 5: 1.9%
Day 6: 1.7%
Day 7: 1.5%
That's a 46% decline from peak over one week. CTR dropping three or more days in a row with a total decline of more than 20% from peak triggers the fatigue flag.
The ad creative monitor skill tracks this automatically:
bash
social marketing insights --preset last_7d --level ad \
  --time-increment 1 --fields "ad_name,date_start,impressions,ctr,cpc,frequency"
Fatigue signals ranked by severity:
When to rotate vs when to wait.
Rotate immediately when: CTR has dropped 20%+ from peak AND frequency is above 3. The audience is exhausted and the creative is dying.
Wait when: CTR dipped for 1-2 days but frequency is still under 2.5. Could be day of week variation. Give it 48 hours.
The difference matters. Rotating too early kills ads that just had a rough Tuesday. Rotating too late burns budget on ads nobody's clicking. The agent watches both signals together and only flags when the combination says "this is real."
Frequency is the most underrated signal in paid media. It predicts fatigue before CTR drops. By the time CTR falls, the audience has already been over-served.
Part 6: Budget Optimization
Most ad accounts have the same problem: budget spread evenly across campaigns when performance isn't even close to even. One campaign printing money at $18 CPL. Another struggling at $52. Both getting the same daily budget.
The budget optimizer fixes that.
Efficiency scoring:
Efficiency = CTR / CPC

Campaign A: CTR 2.4%, CPC $1.20 → Efficiency: 2.0
Campaign B: CTR 1.1%, CPC $2.80 → Efficiency: 0.39
Campaign C: CTR 3.1%, CPC $0.90 → Efficiency: 3.44
Campaign C is working 8.8x harder per dollar than Campaign B. Why are they getting the same budget?
The agent ranks all active campaigns by efficiency, then recommends percentage-based budget shifts:
BUDGET SHIFT RECOMMENDATION:

Campaign C (Founder_Hook_V2)
  Current: $50/day  →  Recommended: $65/day (+30%)
  Reason: Highest efficiency (3.44), CPL $18, ROAS 2.1x, trending up

Campaign A (UGC_Social_Proof)
  Current: $50/day  →  Recommended: $50/day (hold)
  Reason: Solid efficiency (2.0), stable performance

Campaign B (Retargeting_Broad)
  Current: $50/day  →  Recommended: $35/day (-30%)
  Reason: Lowest efficiency (0.39), CPA 2x target, needs creative refresh
The agent recommends. I approve or reject. It executes:
bash
social marketing set-budget adset 23851234567891 --daily-budget 6500
Budget values are in cents. That's $65/day. One command.
Budget shifts are always approval required. I trust the agent to pause obvious bleeders automatically. But moving money around changes your strategy. That stays human approved. At least for now. (Or just tell your agent to go full yolo if you want, it’s your money)
Part 7: Ad Copy Generator
This is where the system stops being a monitoring tool and starts being an actual ad manager.
The agent detects that a campaign needs fresh creative. Maybe fatigue killed an ad. Maybe a winner deserves variants. Here's what used to happen: you'd open Ads Manager, stare at the ad, try to remember what angle worked, draft some copy in a Google Doc, second-guess yourself, get distracted, come back tomorrow. Maybe.
Now the agent does it.
How it works:
First, it pulls what's already converting in your account. Top performing ads by CTR over the last 30 days. Then it reads the actual copy from those winners via the Graph API:
bash
# Pull top performers
social marketing insights --preset last_30d --level ad \
  --fields "ad_name,ctr,cpc,cost_per_action_type" --sort ctr_descending
It extracts the patterns. What headline length works. Whether your winners open with pain, data, or a question. What CTAs convert. What reading level your audience responds to.
Then you give it an image. The actual creative you want to run. The agent analyzes the visual (what's in it, what message the image sends, what emotion it triggers) and writes copy that reinforces that specific image. Not generic copy pasted across every ad. Copy matched to what people are actually going to see.
What the output looks like:
IMAGE ANALYZED: founder-kitchen-laptop.jpg
Visual: Founder working from home, casual, laptop + coffee
Message: This isn't corporate. This is a real person building something.
Emotion: Relatability, aspiration, "I could do this"

VARIANT 1 (Pain → Solution):
Headline: "Still manually checking your ads every morning?"
Body: "I built an AI that does it at 7am. Catches bleeders.
       Scales winners. Sends me a 2-min summary. Free."
CTA: Learn More

VARIANT 2 (Social Proof):
Headline: "This agent saved me $840 last week"
Body: "It paused 3 dying ads I would've missed.
       Scaled 2 winners I was sleeping on. Open source."
CTA: Get Started

VARIANT 3 (Curiosity):
Headline: "My ads run themselves now"
Body: "No agency. No VA. An open source AI agent that watches
       my Meta account 24/7 and tells me what to do over coffee."
CTA: Learn More
Each variant comes out in asset_feed_spec format ready for the next step. 
The copy is pattern-matching against what's already working in your account and writing to reinforce the specific image you're running.
Part 8: Ad Upload
This is the part that made me realize this isn't a monitoring tool anymore. It's a full loop.
The agent generates copy matched to your images. You review it. Then it pushes the ad straight to Meta via the Graph API. Image upload, creative assembly, ad creation. No Ads Manager.
The upload chain:
1. Upload image → Meta returns an image hash
2. Build creative with asset_feed_spec (image + copy variants)
3. Create ad in your target ad set
4. Ad goes live (or into review)
The commands:
bash
# Upload image to ad account
curl -s -X POST "https://graph.facebook.com/v22.0/act_ID/adimages" \
  -F "filename=@founder-kitchen-laptop.jpg" \
  -F "access_token=$TOKEN"

# Create creative with asset_feed_spec
curl -s -X POST "https://graph.facebook.com/v22.0/act_ID/adcreatives" \
  -H "Content-Type: application/json" \
  -d '{"name":"Founder_Hook_V3", "asset_feed_spec":{...}}'

# Create ad in target ad set
curl -s -X POST "https://graph.facebook.com/v22.0/act_ID/ads" \
  -d "adset_id=ADSET_ID&creative={\"creative_id\":\"CREATIVE_ID\"}&status=PAUSED"
Again, I don’t remember any of these commands. I just talk to my agent and it does all of this automatically. 
New ads go in as PAUSED by default. You review. You activate. The agent doesn't go live without your say.
Here's what the full loop looks like in practice:
Monday morning. Agent detects that UGC_TestimonialA has been fatiguing for 3 days. CTR down 24% from peak. Frequency at 3.2. It auto-pauses the ad. Then it pulls the top 3 performing ads in the account, extracts the copy patterns, takes the next image in your creative queue, generates 3 copy variants matched to that image, and uploads them as new ads in the same ad set. Paused. Waiting for you.
Your Telegram at 7:02am:
⚠️ Paused UGC_TestimonialA (fatigue confirmed, CTR -24%)
✍️ Generated 3 variants from Founder_Hook pattern
🚀 Uploaded to February_Prospecting (PAUSED, awaiting review)
   - Founder_Hook_V3a (pain → solution)
   - Founder_Hook_V3b (social proof)
   - Founder_Hook_V3c (curiosity)
Approve to activate?
You reply "activate v3a and v3b." Done.
Monitor → Detect → Optimize → Generate → Upload → Repeat. No Ads Manager at any step. That's the closed loop.
Part 9: A Real Morning, Start to Finish
Let me walk you through what actually happened in one of my accounts. 
6:58am. Phone buzzes. Telegram. The agent's morning brief:
MORNING BRIEF — Feb 25

━━━ PAUSED (auto) ━━━

Retargeting_V3_Feb
  CPA $87 vs $35 target (3 days running)
  CTR 0.7%, Frequency 4.1
  Creative fatigue confirmed
  Saved ~$120/day

━━━ SCALING (needs approval) ━━━

Founder_Hook_V2
  ROAS 2.1x, CPL $18, trending up 4 days
  CTR 3.1%, Frequency 1.8
  Recommend: +30% budget ($50 → $65/day)

━━━ NEW CREATIVE (needs approval) ━━━

Generated from Founder_Hook pattern (top performer)
  3 variants uploaded to February_Prospecting
  Matched to: product-demo-kitchen.jpg
  Status: PAUSED, awaiting review

━━━ WATCH LIST ━━━

UGC_TestimonialA
  CTR 2.4% but CPL rising ($28 → $34 over 3 days)
  Frequency still low (2.1)
  Likely landing page issue, not creative

━━━ TODAY'S NUMBERS ━━━

  Total spend: $342
  Leads: 14
  Avg CPL: $24.43
  Best performer: Founder_Hook_V2 ($18 CPL)
7:01am. I read it. 90 seconds. The retargeting campaign was already paused. Good call. That thing had been dying for days and I kept hoping it would recover. It wasn't going to recover. The agent saw three days of 2.5x CPA and pulled the plug at 3am.
7:02am. I type "approved" on the Founder_Hook scaling rec. Budget bumps from $50 to $65/day. I also approve two of the three new ad variants. The third one's headline was off. I tell the agent "v3c headline too vague, skip it." It learns.
7:03am. I ask about the landing page on UGC_TestimonialA. "CTR is still solid but CPL is rising. What's the LP conversion rate?"
The agent pulls it. Landing page conversion dropped from 4.2% to 3.1% over the same period. CTR on the ad is stable. The creative isn't the problem. The page is.
7:04am. I make a note to check the LP. That's not the agent's job. That's mine.
7:05am. Done. Back to getting my kids ready for school.
The old way? I'd have opened Ads Manager around 9am. Spent 20 minutes clicking through each campaign. Probably wouldn't have noticed the retargeting bleeder until Friday's review. Would have lost another $360 by then. Definitely wouldn't have caught the landing page issue because I would have assumed it was creative fatigue and rotated a perfectly good ad. And I sure as hell wouldn't have had fresh creative variants ready to go.
The agent caught two problems, solved one, generated new creative, and flagged the one that needs a human. Before I was fully awake.
NOTE: For the automated creative I'm using a product I built called StealAds.AI. It's in early access . The Openclaw integration is avail through managed service right now but I'm working on getting that live for everyone. But today, for anyone in early access, StealAds can create dozens (or hundreds) of ads at a time in your brand and with your products based on what's working in your niche. It’s awesome.
Part 10: The Architecture
Here's how the pieces connect:
Cron (7am daily)
    ↓
OpenClaw Agent
    ↓
┌─────────────────────────────────────────────────────────────────┐
│  meta-ads skill              → 5 daily questions, pause/resume  │
│  ad-creative-monitor skill   → fatigue tracking, rotation recs  │
│  budget-optimizer skill      → efficiency scoring, shift recs   │
│  ad-copy-generator skill     → copy matched to image creatives  │
│  ad-upload skill             → push new ads to Meta via API     │
└─────────────────────────────────────────────────────────────────┘
    ↓
social-cli → Meta Marketing API
    ↓
Data + decisions flow back up
    ↓
Telegram / Slack / wherever you want the brief
The full loop:
Monitor → Detect fatigue → Shift budget → Generate copy → Upload ads → Monitor again
Every skill can run standalone. But together they're a closed loop. The agent doesn't just watch your account. It manages it. You just approve.
Why OpenClaw and not just an MCP server?
I actually built the MCP version first. My team deployed it to Railway, added publishing capabilities, got the whole workflow running. MCP is solid for interactive queries. "What's my CTR this week?" and getting an answer.
But MCP requires an active session. Every MCP call costs more tokens. When you want a recurring schedule that runs at 7am every morning whether you're awake or not, that token burn adds up fast.
OpenClaw's cron and heartbeat system solves this. The agent wakes up on schedule, does its job, sends the report, goes back to sleep. MCP is still in the stack for interactive stuff during strategy sessions. But the daily automation runs through OpenClaw.
It's an evolution, not a replacement.
The skills are the knowledge layer. Without them, the agent can call the API but doesn't know what the numbers mean. The meta-ads skill teaches it the 5 daily questions framework. The creative monitor teaches it fatigue signals. The budget optimizer teaches it efficiency scoring. The copy generator teaches it to write for specific images. The uploader teaches it the Graph API chain. Together they're what make the agent behave like someone who actually knows paid media, not just someone who can read a spreadsheet.
Part 11: Setting It Up
30 minutes. That's the honest setup time. Here's every step.
Step 1: Install social-cli (5 minutes)
npm install -g @vishalgojha/social-cli
Step 2: Authenticate with Meta (10 minutes)
social auth login
Opens a browser. Approve the permissions. You need ads_read and ads_management scopes. If you have a Meta app already:
social auth set-app --app-id YOUR_APP_ID --app-secret YOUR_APP_SECRET
social auth login --scopes ads_read,ads_management,read_insights
Step 3: Set your default ad account
social marketing accounts
social marketing set-default-account act_YOUR_ACCOUNT_ID
Step 4: Test it
social marketing status
social marketing insights --preset last_7d --level campaign
The first time you see your ad data in a terminal is a thing. It hits different than Ads Manager.
Step 5: Clone the agent kit (2 minutes)
git clone https://github.com/TheMattBerman/meta-ads-kit.git
cd meta-ads-kit
cp ad-config.example.json ad-config.json
Edit ad-config.json with your target CPA, ROAS goals, and account ID.
Step 6: Start the agent (1 minute)
openclaw start
That's it. The agent picks up all five skills automatically. Point it at your ad account and it's running.
Step 7: Set up the morning cron (5 minutes)
One cron job. Fires at 7am (or whenever you want). Runs the 5 questions. Sends the brief to Telegram, Slack, or email. Your call.
Step 8: Start in review mode
For the first week, the agent recommends everything. You approve. Get comfortable with what it's seeing and how it's reasoning. Then graduate to auto-pause for obvious bleeders. Keep budget shifts and ad uploads in approval mode as long as you want.
You don't have to hand over full autonomy on day one. Start with visibility. Earn trust in both directions.
Part 12: The Manus Problem
Meta just acquired Manus AI. They're rolling AI directly into Ads Manager.
Here's what you need to understand about that: Meta does not optimize for you. They optimize for Meta.
They want you spending more. Broader audiences because broader = more inventory sold. More placements because more placements = more revenue for them. Their AI will always nudge in that direction. Simple incentive alignment.
Look at Meta's track record. Killed organic reach. Changed attribution windows without warning. Sunset tools that entire marketing stacks were built on.
When Meta says "let our AI manage your ads," the question is: manage them toward what outcome? Yours or theirs?
Your own agent optimizes for your target CPA. Your cash flow. Your creative strategy. It has zero incentive to burn your budget faster.
But here's the move: use both.
Meta's AI is genuinely good at targeting and delivery optimization. Advantage+ works. Broad targeting with good creative works. Let Meta handle the auction mechanics. That's their home turf.
Use your own agent for the strategy layer on top. Which campaigns to scale. Which to kill. When creative is fatiguing. Where budget is wasted. When to generate and test something new.
You keep the judgment. They run the auction. That's the split that actually works.
Part 13: Lessons Learned
I'll be honest about what surprised me and what I got wrong.
The 48 hour rule took a while to learn. My first version auto-paused after one bad day. Turned off three ads that were having normal Tuesday dips. Bad days happen. Bad trends are different. You need at least 48 hours to tell the difference.
Frequency is the most underrated signal. I was focused on CTR and CPA. But frequency above 3.5 predicts fatigue before CTR drops. Watching frequency saved me more budget than any other single metric.
The agent is better at pattern recognition than I am. Not smarter. More consistent. I might notice a CTR trend on my best day. The agent notices it every day. At 3am. Without getting distracted by the one ad that's doing great.
Budget optimization needs guardrails. The first version wanted to put 80% of budget into one campaign. Mathematically correct. Strategically stupid. I added a max shift cap of 30% per recommendation. Bigger moves need a conversation.
Landing page issues masquerade as creative fatigue. The UGC_TestimonialA example from the morning brief. CTR was fine. CPL was rising. My instinct was to blame the creative. The agent correctly flagged it as a potential LP issue because upstream metrics were stable. I would have rotated a good ad and wasted a week testing new creative for a problem that lived on the landing page. The agent's lack of emotional attachment saved me.
I should have started with just the 5 daily questions. I built all five skills at once. Took a week. If I'd started with just the meta-ads skill and the morning brief, I'd have been running in an hour. The creative monitor, budget optimizer, copy generator, and uploader are genuinely useful but they're optimization on top of the core loop. Get the 5 questions running first. Add the rest when you feel the gaps.
The copy generator changed the game. Before I added it, the system was a monitoring tool. After I added it, the system was an ad manager. Being able to go from "this ad is fatiguing" to "here are 3 new variants based on what's working, uploaded and ready to activate" without opening Ads Manager is the moment it clicked. That's the closed loop.
Get the Kit
Everything is open source. Everything is free. Not a template. Not one skill. A fully configured OpenClaw agent with five skills, decision logic, thresholds, setup docs, and the full closed loop from monitoring to creative generation to upload.
https://github.com/TheMattBerman/meta-ads-kit
What's in the repo:
Complete OpenClaw agent ready to run (SOUL.md, AGENTS.md, config)
meta-ads skill — 5 daily questions and action commands
ad-creative-monitor skill — fatigue detection before your CPA spikes
budget-optimizer skill — efficiency scoring and budget shift recommendations
ad-copy-generator skill — AI copy matched to your specific image creatives
ad-upload skill — push new ads to Meta via Graph API, no Ads Manager
Morning brief template for Telegram, Slack, or email
ad-config.json for your thresholds and targets
social-cli install and auth setup guide
30 minutes from clone to first automated morning brief.
Clone it. Run it. 