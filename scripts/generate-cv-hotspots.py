"""Generate cv-hotspots.json from assets/cv.pdf layout. Run: python scripts/generate-cv-hotspots.py"""
import json
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "assets/cv.pdf"
OUT = ROOT / "cv-hotspots.json"

LEFT, WIDTH = 21, 71
BOTTOM_PAD = 0.2
TOP_PAD = 0.4
_TOP_PAD_PREFIXES = ("pres-", "research-", "community-", "project-", "skills-")


def region(top, height, width=None, top_pad=0):
    return {
        "left": LEFT,
        "top": round(top - top_pad, 1),
        "width": width if width is not None else WIDTH,
        "height": round(height + top_pad + BOTTOM_PAD, 1),
    }


def item(
    item_id,
    page,
    label,
    top,
    height,
    title,
    description,
    links=None,
    images=None,
    width=None,
    group=None,
    caption_html=None,
):
    entry = {
        "id": item_id,
        "page": page,
        "label": label,
        "popup": {
            "title": title,
            "description": description,
            "images": images or [],
            "files": [],
            "links": links or [],
            "captionHtml": caption_html,
        },
    }
    if group:
        entry["group"] = group
    top_pad = TOP_PAD if item_id.startswith(_TOP_PAD_PREFIXES) else 0
    entry["region"] = region(top, height, width, top_pad)
    return entry


hotspots = [
    item(
        "edu-usc",
        1,
        "USC Honors College",
        13.7,
        6.4,
        "B.S.: University of South Carolina",
        "B.S.: University of South Carolina",
        images=[
            {
                "src": "assets/uscarticle.png",
                "url": "https://sc.edu/study/colleges_schools/engineering_and_computing/news_events/news/2026/soraya_remaili_student_feature.php",
                "alt": "USC student feature article about Soraya Remaili",
                "hoverText": "View Article",
                "captionHtml": "Read more about my time at USC<br>(and a little about TJ)!",
                "size": "small",
            }
        ],
        group="edu-usc-tjhsst",
    ),
    item(
        "edu-tjhsst",
        1,
        "Thomas Jefferson High School",
        21.5,
        6.2,
        "Thomas Jefferson High School for Science and Technology",
        "High School Diploma, June 2023. GPA 4.45 (weighted). AP Scholar with Honor.",
        group="edu-usc-tjhsst",
    ),
    item(
        "edu-sciences-po",
        1,
        "Sciences Po",
        29.2,
        6.5,
        "sciencespo summer school",
        "sciencespo summer school",
        images=[
            {
                "src": "assets/sciencespo.png",
                "alt": "Sciences Po summer school certificate",
            }
        ],
    ),
    item(
        "honor-presidents-list",
        1,
        "USC president's list",
        36.0,
        1.6,
        "USC president's list",
        "USC president's list",
        caption_html='<a href="https://sc.edu/about/offices_and_divisions/registrar/transcripts_and_records/honor_lists/">Honor</a> given to students with a 4.0 GPA.',
    ),
    item(
        "honor-excellence-scholar",
        1,
        "usc academic excellence scholar",
        37.5,
        1.6,
        "usc academic excellence scholar",
        "usc academic excellence scholar",
        caption_html='<a href="https://sc.edu/about/offices_and_divisions/undergraduate_admissions/tuition_scholarships/nonresidents/#accordion-group-10-item-5-content">Scholarship</a> awarding $2000/year.',
    ),
    item(
        "honor-undergrad-scholarship",
        1,
        "usc undergraduate scholarship",
        39.0,
        1.6,
        "usc undergraduate scholarship",
        "usc undergraduate scholarship",
        caption_html='<a href="https://sc.edu/about/offices_and_divisions/undergraduate_admissions/tuition_scholarships/nonresidents/#accordion-group-10-item-5-content">Scholarship</a> awarding in-state tuition.',
    ),
    item(
        "honor-honors-research-grant",
        1,
        "schc research grant",
        40.5,
        1.6,
        "schc research grant",
        "schc research grant",
        caption_html='Two years ($3000/cycle) of <a href="https://sc.edu/study/colleges_schools/honors_college/internal/beyond_the_classroom/undergraduate_research/honorscollege_researchgrants/">funding</a> for my bioacoustics work with Dr. Meyer-Gutbrod.',
    ),
    item(
        "honor-carter-bays",
        1,
        "carter bays endowed scholar",
        42.0,
        1.6,
        "carter bays endowed scholar",
        "carter bays endowed scholar",
        caption_html='<a href="https://sc.edu/study/colleges_schools/engineering_and_computing/docs/student_services/2025-2026_mcec_scholarship_list.pdf">Awarded</a> to undergraduate students majoring in computer science.',
    ),
    item(
        "honor-vlahoplus",
        1,
        "vlahoplus honors scholar",
        43.5,
        1.6,
        "vlahoplus honors scholar",
        "vlahoplus honors scholar",
        caption_html='<a href="https://sc.edu/study/colleges_schools/engineering_and_computing/docs/student_services/2025-2026_mcec_scholarship_list.pdf">Awarded</a> to an Honors College student in the MCEC.',
    ),
    item(
        "honor-provost-ai",
        1,
        "provost undergraduate ai fellow",
        45.0,
        1.6,
        "provost undergraduate ai fellow",
        "provost undergraduate ai fellow",
        caption_html='Fellowship <a href="https://sc.edu/study/colleges_schools/honors_college/internal/academic_advising/provost-ai-fellowship.php">grant</a> for work on an AI-driven research <a href="research.html#water-payment-heading">project</a>.',
    ),
    item(
        "honor-magellan-mini",
        1,
        "magellan mini-grant",
        46.5,
        1.6,
        "magellan mini-grant",
        "magellan mini-grant",
        caption_html='Research <a href="https://sc.edu/about/offices_and_divisions/undergraduate_research/funding_opportunities/our_funding/mini-grants/">grant</a> to continue my bioacoustics work with Dr. Meyer-Gutbrod.',
    ),
    item(
        "honor-seamamms-award",
        1,
        "SEAMAMMS award",
        48.3,
        1.5,
        "SEAMAMMS Runner-Up",
        "SEAMAMMS26 Runner-Up Award",
        images=[
            {
                "src": "assets/IMG_6203.jpg",
                "alt": "Soraya Remaili and mentor Abby Kreuser at the SEAMAMMS awards ceremony",
                "captionHtml": (
                    'My amazing mentor <a href="https://abigailkreuser.weebly.com/">'
                    "Abby</a> and I after the awards ceremony!"
                ),
            }
        ],
    ),
    item(
        "pres-isc-gulf-maine",
        1,
        "ISC 2026 — Gulf of Maine",
        51.0,
        7.3,
        "International Sclerochronology Conference (May 2026)",
        "ISC26: Wanamaker et al.",
        [],
        images=[
            {
                "src": "assets/ISC26Wanamaker.png",
                "url": "assets/ISC26Wanamaker.pdf",
                "hoverText": "View Abstract",
            }
        ],
    ),
    item(
        "pres-isc-mid-atlantic",
        1,
        "ISC 2026 — Mid-Atlantic",
        60.5,
        7.3,
        "International Sclerochronology Conference (May 2026)",
        "ISC26: Thatcher et al.",
        [],
        images=[
            {
                "src": "assets/ISC26Thatcher.png",
                "url": "assets/ISC26Thatcher.pdf",
                "hoverText": "View Abstract",
            }
        ],
    ),
    item(
        "pres-isc-keynote",
        1,
        "ISC 2026 — Keynote",
        70.0,
        11.9,
        "International Sclerochronology Conference — Keynote (May 2026)",
        "ISC26 keynote speaker: Whitney et al.",
        [],
        images=[
            {
                "src": "assets/ISC26Whitney.png",
                "url": "assets/ISC26Whitney.pdf",
                "hoverText": "View Abstract",
            }
        ],
    ),
    item(
        "pres-seamamms",
        1,
        "SEAMAMMS 2026 oral",
        84.1,
        5.8,
        "SEAMAMMS — Wilmington, NC (April 2026)",
        "SEAMAMMS26 talk: Remaili et al.",
        [],
        images=[
            {
                "src": "assets/SEAMAMMS26.png",
                "url": "assets/SEAMAMMS26.pdf",
                "hoverText": "View Abstract",
            }
        ],
        group="pres-seamamms",
    ),
    item(
        "pres-seamamms-cont",
        2,
        "SEAMAMMS (continued)",
        9.4,
        1.2,
        "SEAMAMMS — Wilmington, NC (April 2026)",
        "SEAMAMMS26 talk: Remaili et al.",
        [],
        images=[
            {
                "src": "assets/SEAMAMMS26.png",
                "url": "assets/SEAMAMMS26.pdf",
                "hoverText": "View Abstract",
            }
        ],
        group="pres-seamamms",
    ),
    item(
        "pres-discover-2026",
        2,
        "Discover USC 2026",
        12.8,
        5.8,
        "Discover USC — Columbia, SC (April 2026)",
        "Discover USC26: Remaili et al.",
        images=[
            {
                "src": "assets/SEAMAMMS26.png",
                "url": "assets/SEAMAMMS26.pdf",
                "hoverText": "View Abstract",
            },
            {
                "src": "assets/discoverUSC26.png",
                "url": "assets/discoverUSC26.pdf",
                "hoverText": "View Poster",
            },
        ],
    ),
    item(
        "pres-agu-2025",
        2,
        "AGU 2025",
        20.8,
        8.8,
        "American Geophysical Union — New Orleans (December 2025)",
        "AGU25: Remaili et al.",
        images=[
            {
                "src": "assets/AGU25.png",
                "url": "assets/AGU25.pdf",
                "hoverText": "View Abstract",
            },
            {
                "src": "assets/AGU25Poster.png",
                "url": "assets/AGU25Poster.pdf",
                "hoverText": "View Poster",
            },
        ],
    ),
    item(
        "pres-discover-2025",
        2,
        "Discover USC 2025",
        31.9,
        7.3,
        "Discover USC — Columbia, SC (April 2025)",
        "Discover USC25: Remaili et al.",
        images=[
            {
                "src": "assets/DiscoverUSC25.png",
                "url": "assets/DiscoverUSC25.pdf",
                "hoverText": "View Abstract",
            },
            {
                "src": "assets/discoverUSC25Poster.png",
                "url": "assets/discoverUSC25Poster.pdf",
                "hoverText": "View Poster",
            },
        ],
    ),
    item(
        "pres-narwc-smm-2024",
        2,
        "NARWC 2024",
        41.4,
        7.3,
        "North Atlantic Right Whale Consortium (October 2024)",
        "NARWC24: Meyer-Gutbrod et al.",
        images=[
            {
                "src": "assets/NARWC24.png",
                "url": "assets/NARWC24.pdf",
                "hoverText": "View Poster",
            }
        ],
    ),
    item(
        "research-active-acoustic",
        2,
        "Fulbright Canada–Mitacs",
        50.0,
        16.4,
        "Active Acoustic ID of Arctic Fauna",
        "Fulbright Canada–Mitacs internship at Memorial University (May 2026–Present). WBAT acoustic profiles, Echoview/Python processing, unsupervised classification of fish and zooplankton.",
        [{"label": "View more information here", "url": "research.html#arctic-fauna-heading"}],
    ),
    item(
        "research-water-billing",
        2,
        "Nairobi water typologies",
        68.1,
        11.8,
        "Water Supply and Bill Payment Typologies",
        "USC SEOE with Dr. David Fuente (Feb 2026–Present). Modeled Nairobi billing/payment behavior; Gaussian mixture models for customer typologies.",
        [{"label": "View more information here", "url": "research.html#water-payment-heading"}],
    ),
    item(
        "research-paleo-reu",
        2,
        "Paleoceanographic REU",
        81.7,
        8.8,
        "Paleoceanographic Proxy Modeling",
        "NSF-REU at Shannon Point Marine Center (Summer 2025). Python paleoceanographic modeling and multi-taper spectral analysis with Dr. Nina Whitney.",
        [{"label": "View more information here", "url": "research.html#proxy-modeling-heading"}],
        group="research-paleo-reu",
    ),
    item(
        "research-paleo-reu-cont",
        3,
        "Paleoceanographic REU (cont.)",
        9.4,
        4.2,
        "Paleoceanographic Proxy Modeling",
        "Presented at symposiums; skills include Pyleoclim, climate data wrangling, and multi-taper spectral analysis.",
        [{"label": "View more information here", "url": "research.html#proxy-modeling-heading"}],
        group="research-paleo-reu",
    ),
    item(
        "research-noaa-workshop",
        3,
        "NOAA workshop",
        15.4,
        7.3,
        "noaa workshop",
        "noaa workshop",
        images=[
            {
                "src": "assets/pitchtrack.png",
                "alt": "Real-time pitch track example",
                "caption": "An example of a real-time pitch track.",
            }
        ],
    ),
    item(
        "research-bioacoustics",
        3,
        "Bioacoustics — Meyer-Gutbrod",
        24.5,
        14.8,
        "Real-Time Bioacoustic Monitoring",
        "USC SEOE with Dr. Erin Meyer-Gutbrod (March 2024–Present). Baleen whale acoustic detection with Python, Raven, R, and LFDCS; real-time processing and conservation-focused evaluation.",
        [{"label": "View more information here", "url": "research.html#bioacoustics-heading"}],
    ),
    item(
        "research-jellyfish",
        3,
        "Jellyfish bioremediation",
        41.1,
        13.3,
        "senior research",
        "senior research",
        images=[
            {
                "src": "assets/jellyfish.jpg",
                "alt": "Jellyfish research project",
                "captionHtml": "Here's the project that first got me interested in marine science! It's a very rudimentary effort, especially since it was in high school, but you can check out the journal I kept for it <a href=\"https://quickest-toque-d54.notion.site/Jellyfish-Tracking-Journal-6e53f19e5f6c44aba5377431b07d2add\">here</a>.",
            }
        ],
    ),
    item(
        "community-theta-tau",
        3,
        "Theta Tau service",
        55.7,
        5.8,
        "service/dei chair",
        "service/dei chair",
        images=[
            {
                "src": "assets/pumpkin.jpg",
                "alt": "Pumpkin painting mental health night",
                "caption": "Pumpkin painting mental health night!",
            }
        ],
    ),
    item(
        "community-tech-camp",
        3,
        "Technology Adventure Camp",
        63.3,
        8.8,
        "fcps tech camp",
        "fcps tech camp",
        images=[
            {
                "src": "assets/maze.jpg",
                "alt": "Maze built for students to race robots in",
                "caption": "A maze I built for students to race their robots in.",
            }
        ],
    ),
    item(
        "community-touch-tank",
        3,
        "Library touch tank",
        73.4,
        2.8,
        "touch tank outreach",
        "touch tank outreach",
        images=[
            {
                "src": "assets/oakharbor.jpg",
                "alt": "REU cohort running the touch tank outreach event",
                "caption": "My REU cohort and I running the touch tank!",
            }
        ],
    ),
    item(
        "community-guardianes",
        3,
        "Guardianes Del Mar",
        77.9,
        2.8,
        "guardianes del mar",
        "guardianes del mar",
        caption_html='See more <a class="cv-caption-green-link" href="https://www.thesalishseaschool.org/guardians-of-the-sea">here</a> about the program.',
    ),
    item(
        "community-narw-festival",
        3,
        "Right Whale Festival",
        82.5,
        2.7,
        "narw festival",
        "narw festival",
        images=[
            {
                "src": "assets/narwfestival.jpg",
                "alt": "North Atlantic right whale festival booth visitors listening to sounds",
                "caption": "Showing off some sounds to booth visitors!",
            }
        ],
    ),
    item(
        "project-pathways",
        3,
        "Pathways platform",
        86.6,
        4.3,
        "pathways webapp",
        "pathways webapp",
        images=[
            {
                "src": "assets/csce492thesis.png",
                "url": "assets/csce492thesis.pdf",
                "alt": "CSCE 492 thesis for the Pathways webapp",
                "hoverText": "View Thesis",
                "captionHtml": 'This is the <a class="cv-caption-green-link" href="https://capstone.cse.sc.edu/video/2026/Pathways/">webapp</a> I made for my computing honors thesis.',
                "size": "tiny",
            }
        ],
        group="project-pathways",
    ),
    item(
        "project-pathways-cont",
        4,
        "Pathways (continued)",
        9.3,
        2.8,
        "pathways webapp",
        "pathways webapp",
        images=[
            {
                "src": "assets/csce492thesis.png",
                "url": "assets/csce492thesis.pdf",
                "alt": "CSCE 492 thesis for the Pathways webapp",
                "hoverText": "View Thesis",
                "captionHtml": 'This is the <a class="cv-caption-green-link" href="https://capstone.cse.sc.edu/video/2026/Pathways/">webapp</a> I made for my computing honors thesis.',
                "size": "tiny",
            }
        ],
        group="project-pathways",
    ),
    item(
        "project-degreebetter",
        4,
        "DegreeBetter",
        13.9,
        5.8,
        "degreebetter",
        "degreebetter",
        images=[
            {
                "src": "assets/csce247-design-document.png",
                "url": "assets/csce247-design-document.pdf",
                "alt": "DegreeBetter design document",
                "hoverText": "View Design",
                "caption": "My first SWE project and an initial foray into UX design. Sadly, the repo must stay private, but check out our design layout and UML diagram!",
                "size": "page-fit",
            },
            {
                "src": "assets/uml-diagram.png",
                "url": "assets/uml-diagram.pdf",
                "alt": "DegreeBetter UML diagram",
                "hoverText": "View UML",
                "caption": "My first SWE project and an initial foray into UX design. Sadly, the repo must stay private, but check out our design layout and UML diagram!",
            },
        ],
    ),
    item(
        "project-portfolio",
        4,
        "Personal website",
        21.4,
        4.3,
        "personal website",
        "personal website",
        caption_html='You&apos;re in the right place!<br>Check out the repo for it <a class="cv-caption-green-link" href="https://github.com/sorayarem/sorayarem.github.io">here</a>.',
    ),
    item(
        "project-riscv",
        4,
        "Tiny RISC-V OS",
        27.5,
        5.8,
        "tiny riscv os",
        "tiny riscv os",
        caption_html='My first venture into C and OS coding, but also my first real test with (professor-mandated) prompt engineering. See the output <a class="cv-caption-green-link" href="https://github.com/sorayarem/csce311program2">here</a>.',
    ),
    item(
        "project-f1",
        4,
        "Formula 1 analysis",
        35.0,
        7.3,
        "formula 1 analytics",
        "formula 1 analytics",
        images=[
            {
                "src": "assets/stat542.png",
                "url": "assets/stat542.pdf",
                "alt": "STAT 542 Formula 1 analytics report",
                "hoverText": "View Report",
                "captionHtml": 'I&apos;m a big fan of Formula 1! Here&apos;s a <a class="cv-caption-green-link" href="https://github.com/sorayarem/formula1analysis">project</a> I did in R for one of my classes on F1 analytics.',
                "size": "small",
            }
        ],
    ),
    item(
        "skills-french",
        4,
        "French & Arabic",
        43.7,
        2.7,
        "French & Arabic",
        "French & Arabic",
        caption_html="My parents are French and Algerian, so I dabble in some of the local languages. I'm always trying to improve though, particularly through some great French TV shows!",
    ),
    item(
        "skills-technical",
        4,
        "Technical skills",
        46.7,
        2.7,
        "technical skills",
        "technical skills",
        caption_html='Check out my projects and <a href="https://github.com/sorayarem">GitHub</a> for some examples of my code. Some of my research-related repos are private, but check out the <a href="research.html">Research</a> page for more.',
    ),
    item(
        "skills-certifications",
        4,
        "CITI & USC certifications",
        49.7,
        2.8,
        "CITI & USC Certifications",
        "CITI & USC Certifications",
        images=[
            {
                "src": "assets/citi1.png",
                "url": "assets/citi1.pdf",
                "alt": "CITI physical sciences certification",
                "hoverText": "View Certificate",
                "caption": "Physical Science",
            },
            {
                "src": "assets/citi2.png",
                "url": "assets/citi2.pdf",
                "alt": "CITI social and behavioral certification",
                "hoverText": "View Certificate",
                "caption": "Social and Behavioral",
            },
            {
                "src": "assets/garnetai.png",
                "alt": "Garnet AI Fluency certification",
                "caption": "Garnet AI Fluency",
            },
        ],
    ),
]

config = {"hotspots": hotspots}
OUT.write_text(json.dumps(config, indent=2) + "\n", encoding="utf-8")
data_js = ROOT / "cv-hotspots-data.js"
data_js.write_text(
    "window.CV_HOTSPOTS_CONFIG = "
    + json.dumps(config, indent=2)
    + ";\n",
    encoding="utf-8",
)
print(f"Wrote {len(hotspots)} hotspots to {OUT} and {data_js.name}")
