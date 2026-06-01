"""Generate cv-hotspots.json from cv.pdf layout. Run: python scripts/generate-cv-hotspots.py"""
import json
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "cv.pdf"
OUT = ROOT / "cv-hotspots.json"

# Body text starts ~22%; longest lines/dates extend to ~91% (see scripts/dump_cv_page1.py)
LEFT, WIDTH = 21, 71
BOTTOM_PAD = 0.2
# Slight gap above first line for Posters/Presentations and everything below
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
        },
    }
    if group:
        entry["group"] = group
    top_pad = TOP_PAD if item_id.startswith(_TOP_PAD_PREFIXES) else 0
    entry["region"] = region(top, height, width, top_pad)
    return entry


# Hand-tuned from PDF text positions (scripts/extract_cv_p234.py)
hotspots = [
    # --- Education (page 1) ---
    item(
        "edu-usc",
        1,
        "USC Honors College",
        13.7,
        6.4,
        "University of South Carolina Honors College",
        "B.S. in Computer Science, Statistics, and Biology with Honors. Expected May 2027. GPA 4.0/4.0.",
        [{"label": "USC Honors College", "url": "https://www.sc.edu"}],
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
        "Sciences Po — Paris",
        "Summer Certification, July 2022. Final grade 17.75/20. Focus on international negotiation and affairs.",
    ),
    # --- Honors (page 1) ---
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
                "src": "IMG_6203.jpg",
                "alt": "Soraya Remaili and mentor Abby Kreuser at the SEAMAMMS awards ceremony",
                "captionHtml": (
                    'My amazing mentor <a href="https://abigailkreuser.weebly.com/">'
                    "Abby</a> and I after the awards ceremony!"
                ),
            }
        ],
    ),
    # --- Presentations page 1 (top/height from cv.pdf via scripts/dump_cv_page1_pres.py) ---
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
                "src": "ISC26Wanamaker.png",
                "url": "ISC26Wanamaker.pdf",
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
                "src": "ISC26Thatcher.png",
                "url": "ISC26Thatcher.pdf",
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
                "src": "ISC26Whitney.png",
                "url": "ISC26Whitney.pdf",
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
                "src": "SEAMAMMS26.png",
                "url": "SEAMAMMS26.pdf",
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
                "src": "SEAMAMMS26.png",
                "url": "SEAMAMMS26.pdf",
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
                "src": "SEAMAMMS26.png",
                "url": "SEAMAMMS26.pdf",
                "hoverText": "View Abstract",
            },
            {
                "src": "discoverUSC26.png",
                "url": "discoverUSC26.pdf",
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
                "src": "AGU25.png",
                "url": "AGU25.pdf",
                "hoverText": "View Abstract",
            },
            {
                "src": "AGU25Poster.png",
                "url": "AGU25Poster.pdf",
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
                "src": "DiscoverUSC25.png",
                "url": "DiscoverUSC25.pdf",
                "hoverText": "View Abstract",
            },
            {
                "src": "discoverUSC25Poster.png",
                "url": "discoverUSC25Poster.pdf",
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
                "src": "NARWC24.png",
                "url": "NARWC24.pdf",
                "hoverText": "View Poster",
            }
        ],
    ),
    # --- Research experience (pages 2–3; top = entry title y0, height = last line y1 − top) ---
    item(
        "research-active-acoustic",
        2,
        "Fulbright Canada–Mitacs",
        50.0,
        16.4,
        "Active Acoustic ID of Arctic Fauna",
        "Fulbright Canada–Mitacs internship at Memorial University (May 2026–Present). WBAT acoustic profiles, Echoview/Python processing, unsupervised classification of fish and zooplankton.",
    ),
    item(
        "research-water-billing",
        2,
        "Nairobi water typologies",
        68.1,
        11.8,
        "Water and Bill Payment Typologies",
        "USC SEOE with Dr. David Fuente (Feb 2026–Present). Modeled Nairobi billing/payment behavior; Gaussian mixture models for customer typologies.",
    ),
    item(
        "research-paleo-reu",
        2,
        "Paleoceanographic REU",
        81.7,
        8.8,
        "Paleoceanographic Modeling — REU",
        "NSF-REU at Shannon Point Marine Center (Summer 2025). Python paleoceanographic modeling and multi-taper spectral analysis with Dr. Nina Whitney.",
        group="research-paleo-reu",
    ),
    item(
        "research-paleo-reu-cont",
        3,
        "Paleoceanographic REU (cont.)",
        9.4,
        4.2,
        "Paleoceanographic Modeling — REU",
        "Presented at symposiums; skills include Pyleoclim, climate data wrangling, and multi-taper spectral analysis.",
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
        "Bioacoustic Data Analysis",
        "USC SEOE with Dr. Erin Meyer-Gutbrod (March 2024–Present). Baleen whale acoustic detection with Python, Raven, R, and LFDCS; real-time processing and conservation-focused evaluation.",
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
    # --- Community (page 3; tops/heights from cv.pdf page 3 text bounds) ---
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
    # --- Projects (pages 3–4) ---
    item(
        "project-pathways",
        3,
        "Pathways platform",
        86.6,
        4.3,
        "Pathways: Campus Connection Made Easy",
        "Full-stack student platform: campus navigation, events, courses, calendars, and career tools.",
        group="project-pathways",
    ),
    item(
        "project-pathways-cont",
        4,
        "Pathways (continued)",
        9.3,
        2.8,
        "Pathways: Campus Connection Made Easy",
        "Built with React, Django REST Framework, Docker, Redis, Celery, and GitHub Actions.",
        [{"label": "GitHub", "url": "https://github.com/sorayarem"}],
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
        "Personal Website and Portfolio",
        "Responsive portfolio with HTML, CSS, and JavaScript; hosted on GitHub Pages.",
        [{"label": "This site", "url": "index.html"}],
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
        "Formula 1 Data Analysis",
        "R analysis of constructor performance, race geography, and championship trends.",
        [{"label": "GitHub", "url": "https://github.com/sorayarem"}],
    ),
    # --- Skills (page 4; from cv.pdf page 4 text bounds) ---
    item("skills-french", 4, "French", 43.7, 1.2, "French", "Professional working proficiency; Virginia State Seal of Biliteracy."),
    item("skills-darija", 4, "Algerian Darija", 45.2, 1.2, "Algerian Darija", "Limited working proficiency; Johns Hopkins CTY courses."),
    item(
        "skills-technical",
        4,
        "Technical skills",
        46.7,
        2.7,
        "Technical Skills",
        "R/RStudio, Python, C++, Java/JavaFX, SQL, Git & GitHub, Raven, HTML/CSS, FXML, LFDCS, Echoview, MATLAB.",
    ),
    item(
        "skills-certifications",
        4,
        "CITI & USC certifications",
        49.7,
        2.8,
        "Research & AI Certifications",
        "CITI physical and social/behavioral RCR; USC Garnet AI Fluency.",
    ),
]

config = {"hotspots": hotspots}
OUT.write_text(json.dumps(config, indent=2) + "\n", encoding="utf-8")
data_js = ROOT / "cv-hotspots-data.js"
data_js.write_text(
    "/** Auto-generated by scripts/generate-cv-hotspots.py — do not edit by hand. */\n"
    "window.CV_HOTSPOTS_CONFIG = "
    + json.dumps(config, indent=2)
    + ";\n",
    encoding="utf-8",
)
print(f"Wrote {len(hotspots)} hotspots to {OUT} and {data_js.name}")
