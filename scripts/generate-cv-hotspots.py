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
                "caption": "Read more about my time at USC!",
                "size": "small",
            }
        ],
    ),
    item(
        "edu-tjhsst",
        1,
        "Thomas Jefferson High School",
        21.5,
        6.2,
        "Thomas Jefferson High School for Science and Technology",
        "High School Diploma, June 2023. GPA 4.45 (weighted). AP Scholar with Honor.",
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
    item("honor-presidents-list", 1, "President's List", 36.0, 1.6, "President's List", "University of South Carolina President's List, 2023–Present."),
    item("honor-excellence-scholar", 1, "Academic Excellence Scholar", 37.5, 1.6, "Academic Excellence Scholar", "University of South Carolina Academic Excellence Scholar, $2,000/year."),
    item("honor-undergrad-scholarship", 1, "Undergraduate Scholarship", 39.0, 1.6, "Undergraduate Scholarship", "University of South Carolina Undergraduate Scholarship, $25,000/year."),
    item("honor-honors-research-grant", 1, "Honors Research Grant", 40.5, 1.6, "Honors College Research Grant", "South Carolina Honors College Undergraduate Research Grant, 2024–2026, $6,000."),
    item("honor-carter-bays", 1, "Carter Bays Scholarship", 42.0, 1.6, "Carter Bays Scholarship", "Carter Bays Endowed Scholarship for Computer Science, 2024–2025, $1,000."),
    item("honor-vlahoplus", 1, "Vlahoplus Scholarship", 43.5, 1.6, "Vlahoplus Engineering Honors Scholarship", "Vlahoplus Engineering Honors Scholarship, 2025–2026, $1,000."),
    item("honor-provost-ai", 1, "Provost AI Fellowship", 45.0, 1.6, "Provost AI Undergraduate Fellowship", "Provost AI Undergraduate Fellowship, 2026, $5,000."),
    item("honor-magellan-mini", 1, "Magellan Mini Grant", 46.5, 1.6, "Magellan Mini Research Grant", "Magellan Mini Research Grant, 2026, $750."),
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
        [{"label": "Research page", "url": "research.html"}],
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
        [{"label": "Research page", "url": "research.html"}],
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
        "NOAA Real-Time Analysis Workshop",
        "May 2024. Real-time environmental data analysis with NOAA scientists through simulations and case studies.",
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
        "Jellyfish Bioremediation",
        "Thomas Jefferson HS with Dr. Shawn Stickler (2021–2023). Tank maintenance, water quality monitoring, and aquatic ecosystem restoration experiments.",
    ),
    item(
        "community-theta-tau",
        3,
        "Theta Tau service",
        55.7,
        5.8,
        "Theta Tau — Service & DEI Chair",
        "Spring/Fall 2024. Co-led service and equity committees; managed project budgets and funding.",
    ),
    item(
        "community-tech-camp",
        3,
        "Technology Adventure Camp",
        63.3,
        8.8,
        "Technology Adventure Camp Instructor",
        "July 2024, Fairfax County Public Schools. Taught robotics, coding, and sensors to children.",
    ),
    item(
        "community-touch-tank",
        3,
        "Library touch tank",
        73.4,
        2.8,
        "Public Library Touch Tank",
        "July 2025, Anacortes & Oak Harbor. Marine habitat learning experience for 100+ children.",
    ),
    item(
        "community-guardianes",
        3,
        "Guardianes Del Mar",
        77.9,
        2.8,
        "Guardianes Del Mar STEM Program",
        "June 2025. Intertidal zone and microscopy workshop for middle-school students.",
    ),
    item(
        "community-narw-festival",
        3,
        "Right Whale Festival",
        82.5,
        2.7,
        "North Atlantic Right Whale Festival",
        "November 2024. Bioacoustics activities for 300+ visitors.",
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
        "DegreeBetter Academic Management System",
        "Java/JavaFX degree planning system with backend for requirements and degree tracking.",
        [{"label": "GitHub", "url": "https://github.com/sorayarem"}],
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
        "Tiny RISC-V Operating System",
        "Bare-metal RISC-V OS in C and assembly: program loader, in-memory filesystem, spinlocks, and permissions.",
        [{"label": "GitHub", "url": "https://github.com/sorayarem"}],
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
    item("skills-french", 4, "French", 43.7, 1.2, "French", "Professional working proficiency; Virginia State Seal of Biliteracy."),
    item("skills-darija", 4, "Algerian Darija", 45.2, 1.2, "Algerian Darija", "Limited working proficiency; Johns Hopkins CTY courses."),
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
