# WhatsApp Chat Cleaner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a standalone Python script to clean a WhatsApp chat export file, anonymize participant names and mentions, filter out non-message content, split messages into conversation sessions (separated by gaps of >3 hours or 50 messages), and output the result as a `.jsonl` file in OpenAI's chat fine-tuning format.

**Architecture:** Use a RegEx-based parser with a state machine to handle multiline messages, maintaining a map of participants to anonymous IDs. Divide the messages into conversation sessions based on timestamp differences (>= 3 hours) or session length (>= 50 messages), and output the formatted data.

**Tech Stack:** Python 3 (Standard Library: `re`, `json`, `datetime`, `os`, `unittest`).

---

### Task 1: Create Parsing Tests and Basic Parser

**Files:**
- Create: `c:/Users/tobia/Desktop/Ratings_Cotorra/scripts/test_clean_chat.py`
- Create: `c:/Users/tobia/Desktop/Ratings_Cotorra/scripts/clean_chat.py`

- [ ] **Step 1: Write the failing tests for line parsing**

Write initial tests in `scripts/test_clean_chat.py` for matching dates, parsing message headers, and checking for system messages.

```python
import unittest
import datetime
from clean_chat import parse_line, is_system_message, clean_text

class TestChatCleaner(unittest.TestCase):
    def test_parse_line(self):
        # Match standard date headers
        line1 = "10/3/22 21:02 - Santi Mata: Hola"
        matched, date_obj, sender, content = parse_line(line1)
        self.assertTrue(matched)
        self.assertEqual(date_obj, datetime.datetime(2022, 3, 10, 21, 2))
        self.assertEqual(sender, "Santi Mata")
        self.assertEqual(content, "Hola")

        # Multiline line (no date header)
        line2 = "Copa de la décima"
        matched, _, _, _ = parse_line(line2)
        self.assertFalse(matched)

    def test_is_system_message(self):
        self.assertTrue(is_system_message("Santi Mata te añadió"))
        self.assertTrue(is_system_message("Santi Mata creó el grupo \"Ark\"."))
        self.assertFalse(is_system_message("Santi Mata: Hola"))

    def test_clean_text(self):
        self.assertEqual(clean_text("Hola\u2068\u2069"), "Hola")

if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest scripts/test_clean_chat.py`
Expected: FAIL (module/functions do not exist)

- [ ] **Step 3: Write minimal implementation in `clean_chat.py`**

Write the basic helper functions in `scripts/clean_chat.py`:

```python
import re
import datetime

# Pattern: D/M/YY HH:MM or DD/MM/YY HH:MM
# Handles the prefix ending in " - "
HEADER_REGEX = re.compile(r"^(\d{1,2})/(\d{1,2})/(\d{2,4})\s+(\d{1,2}):(\d{2})\s+-\s+(.*?)$")

def parse_line(line):
    line = line.strip()
    match = HEADER_REGEX.match(line)
    if not match:
        return False, None, None, None
    
    day, month, year, hour, minute, rest = match.groups()
    
    # Normalize 2-digit year to 4-digit
    year_int = int(year)
    if year_int < 100:
        year_int += 2000
    
    date_obj = datetime.datetime(year_int, int(month), int(day), int(hour), int(minute))
    
    # Check if this contains a sender name separator
    # Format: "Sender Name: Message"
    if ":" in rest:
        parts = rest.split(":", 1)
        sender = parts[0].strip()
        content = parts[1].strip()
        # Clean special LTR/RTL marks
        sender = sender.replace("\u200e", "").replace("\u200f", "")
        return True, date_obj, sender, content
    
    # System message or other header format without sender
    return True, date_obj, None, rest.strip()

def is_system_message(content):
    # System messages don't have a colon separator or are system actions
    # We can detect they have no sender (None)
    return False

def clean_text(text):
    # Strip invisible layout chars
    return text.replace("\u2068", "").replace("\u2069", "").replace("\u200e", "").replace("\u200f", "").strip()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m unittest scripts/test_clean_chat.py`
Expected: PASS

---

### Task 2: Implement Cleaning Filters and Multiline State Machine

**Files:**
- Modify: `c:/Users/tobia\Desktop\Ratings_Cotorra/scripts/test_clean_chat.py`
- Modify: `c:/Users/tobia\Desktop\Ratings_Cotorra/scripts/clean_chat.py`

- [ ] **Step 1: Write failing tests for filtering and state machine**

Add tests to `scripts/test_clean_chat.py`:

```python
    def test_should_filter_message(self):
        from clean_chat import should_filter_message
        self.assertTrue(should_filter_message("<Multimedia omitido>"))
        self.assertTrue(should_filter_message("Se eliminó este mensaje."))
        self.assertTrue(should_filter_message("https://vm.tiktok.com/ZMLTw9LKW/"))
        self.assertTrue(should_filter_message("."))
        self.assertTrue(should_filter_message(" , "))
        self.assertFalse(should_filter_message("Hola"))
        self.assertFalse(should_filter_message("💪"))

    def test_state_machine_parse(self):
        from clean_chat import parse_chat_lines
        lines = [
            "10/3/22 20:44 - Los mensajes y las llamadas están cifrados...",
            "10/3/22 21:02 - Santi Mata: <Multimedia omitido>",
            "10/3/22 21:02 - Santi Mata: Y ogro desmayado",
            "10/3/22 21:03 - Truca: Ajajajajaja",
            "Copa dela novena ✅",
            "10/3/22 21:30 - Tomi Fabiani: Chau"
        ]
        messages = parse_chat_lines(lines)
        # Expected:
        # 1. "Santi Mata: Y ogro desmayado"
        # 2. "Truca: Ajajajajaja\nCopa dela novena ✅"
        # 3. "Tomi Fabiani: Chau"
        self.assertEqual(len(messages), 3)
        self.assertEqual(messages[0]["sender"], "Santi Mata")
        self.assertEqual(messages[0]["content"], "Y ogro desmayado")
        self.assertEqual(messages[1]["sender"], "Truca")
        self.assertEqual(messages[1]["content"], "Ajajajajaja\nCopa dela novena ✅")
        self.assertEqual(messages[2]["sender"], "Tomi Fabiani")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest scripts/test_clean_chat.py`
Expected: FAIL (functions do not exist or behave incorrectly)

- [ ] **Step 3: Implement state machine and filters in `clean_chat.py`**

Implement filters and parsing logic:

```python
URL_REGEX = re.compile(r"https?://\S+")

def should_filter_message(content):
    content_stripped = content.strip()
    if not content_stripped:
        return True
    
    # 1. Multimedia Omitted
    if "<Multimedia omitido>" in content_stripped or "<Media omitted>" in content_stripped:
        return True
    
    # 2. Deleted messages
    if "Se eliminó este mensaje." in content_stripped or "This message was deleted." in content_stripped:
        return True
    
    # 3. URLs
    if URL_REGEX.search(content_stripped):
        return True
    
    # 4. Very short messages like punctuation
    # Remove emojis to check length of punctuation/whitespace
    no_emojis = re.sub(r"[^\w\s]", "", content_stripped).strip()
    if len(content_stripped) <= 2 and not no_emojis and content_stripped in [".", ",", "..", "...", "?", "!", ";"]:
        return True
        
    return False

def parse_chat_lines(lines):
    parsed_messages = []
    current_msg = None
    
    for line in lines:
        line = line.replace("\n", "").replace("\r", "")
        matched, date_obj, sender, content = parse_line(line)
        
        if matched:
            # If we matched a new header, save current message if valid
            if current_msg:
                if current_msg["sender"] and not should_filter_message(current_msg["content"]):
                    parsed_messages.append(current_msg)
                current_msg = None
                
            # If it's a user message, initialize current_msg
            if sender:
                current_msg = {
                    "timestamp": date_obj,
                    "sender": sender,
                    "content": content
                }
            # If it is a system message (sender is None), ignore it
        else:
            # Line continuation
            if current_msg:
                current_msg["content"] += "\n" + line
                
    # Save the last message if valid
    if current_msg and current_msg["sender"] and not should_filter_message(current_msg["content"]):
        parsed_messages.append(current_msg)
        
    return parsed_messages
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m unittest scripts/test_clean_chat.py`
Expected: PASS

---

### Task 3: Implement Anonymization and Session Splitting

**Files:**
- Modify: `c:/Users/tobia\Desktop\Ratings_Cotorra/scripts/test_clean_chat.py`
- Modify: `c:/Users/tobia\Desktop\Ratings_Cotorra/scripts/clean_chat.py`

- [ ] **Step 1: Write failing tests for anonymization and splitting**

Add tests to `scripts/test_clean_chat.py`:

```python
    def test_anonymization(self):
        from clean_chat import anonymize_messages
        messages = [
            {"sender": "Santi Mata", "content": "Hola @Truca qué haces", "timestamp": None},
            {"sender": "Truca", "content": "Hola Santi Mata", "timestamp": None}
        ]
        anon_msgs, sender_map = anonymize_messages(messages)
        # Expected:
        # Santi Mata -> Usuario_1
        # Truca -> Usuario_2
        self.assertEqual(sender_map["Santi Mata"], "Usuario_1")
        self.assertEqual(sender_map["Truca"], "Usuario_2")
        self.assertEqual(anon_msgs[0]["sender"], "Usuario_1")
        self.assertEqual(anon_msgs[0]["content"], "Hola @Usuario_2 qué haces")
        self.assertEqual(anon_msgs[1]["sender"], "Usuario_2")
        self.assertEqual(anon_msgs[1]["content"], "Hola Usuario_1")

    def test_split_sessions(self):
        from clean_chat import split_into_sessions
        base_time = datetime.datetime(2022, 3, 10, 12, 0)
        messages = [
            {"sender": "Usuario_1", "content": "msg1", "timestamp": base_time},
            {"sender": "Usuario_2", "content": "msg2", "timestamp": base_time + datetime.timedelta(minutes=30)},
            # 3.5 hours later -> starts new session
            {"sender": "Usuario_1", "content": "msg3", "timestamp": base_time + datetime.timedelta(hours=4)},
            {"sender": "Usuario_2", "content": "msg4", "timestamp": base_time + datetime.timedelta(hours=4, minutes=10)},
        ]
        sessions = split_into_sessions(messages, gap_hours=3.0, max_session_len=50)
        self.assertEqual(len(sessions), 2)
        self.assertEqual(len(sessions[0]), 2)
        self.assertEqual(len(sessions[1]), 2)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest scripts/test_clean_chat.py`
Expected: FAIL (functions do not exist or behave incorrectly)

- [ ] **Step 3: Implement anonymization and splitting in `clean_chat.py`**

Implement anonymization and splitting functions:

```python
def anonymize_messages(messages):
    sender_map = {}
    anon_counter = 1
    
    # 1. Map all sender names first
    for msg in messages:
        sender = msg["sender"]
        if sender not in sender_map:
            sender_map[sender] = f"Usuario_{anon_counter}"
            anon_counter += 1
            
    # Sort names by length descending to prevent sub-string collision replacements
    sorted_names = sorted(sender_map.keys(), key=len, reverse=True)
    
    # 2. Map message contents and replace mentions
    anonymized_messages = []
    for msg in messages:
        sender_anon = sender_map[msg["sender"]]
        content = clean_text(msg["content"])
        
        # Replace mention of names in the text
        for name in sorted_names:
            # Replace exactly case-insensitively using regex word boundaries or simple replace
            # We can use regex with word boundary or simple replacement for names
            anon_id = sender_map[name]
            # Match word boundary or custom prefix
            # Escape to be safe
            escaped_name = re.escape(name)
            pattern = re.compile(rf"\b{escaped_name}\b", re.IGNORECASE)
            content = pattern.sub(anon_id, content)
            
        anonymized_messages.append({
            "sender": sender_anon,
            "content": content,
            "timestamp": msg["timestamp"]
        })
        
    return anonymized_messages, sender_map

def split_into_sessions(messages, gap_hours=3.0, max_session_len=50):
    sessions = []
    current_session = []
    
    for i, msg in enumerate(messages):
        if not current_session:
            current_session.append(msg)
            continue
        
        prev_msg = current_session[-1]
        time_diff = msg["timestamp"] - prev_msg["timestamp"]
        diff_hours = time_diff.total_seconds() / 3600.0
        
        if diff_hours >= gap_hours or len(current_session) >= max_session_len:
            sessions.append(current_session)
            current_session = [msg]
        else:
            current_session.append(msg)
            
    if current_session:
        sessions.append(current_session)
        
    return sessions
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m unittest scripts/test_clean_chat.py`
Expected: PASS

---

### Task 4: Command-Line Interface and File Writing

**Files:**
- Modify: `c:/Users/tobia\Desktop\Ratings_Cotorra/scripts/clean_chat.py`

- [ ] **Step 1: Write CLI execution wrapper in `clean_chat.py`**

Append the main entry point code to `clean_chat.py` to read the raw txt file and output the cleaned jsonl file:

```python
import sys
import os
import json

def process_chat(input_path, output_path, gap_hours=3.0, max_session_len=50):
    if not os.path.exists(input_path):
        print(f"Error: Input file '{input_path}' not found.")
        sys.exit(1)
        
    print(f"Reading: {input_path}")
    with open(input_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    print(f"Parsing {len(lines)} lines...")
    parsed = parse_chat_lines(lines)
    print(f"Found {len(parsed)} valid user messages after initial filters.")
    
    print("Anonymizing senders and content...")
    anon_msgs, sender_map = anonymize_messages(parsed)
    print(f"Participants mapped: {sender_map}")
    
    print(f"Splitting into sessions (gap = {gap_hours} hours, max_len = {max_session_len})...")
    sessions = split_into_sessions(anon_msgs, gap_hours, max_session_len)
    print(f"Generated {len(sessions)} conversation sessions.")
    
    print(f"Writing output to {output_path}...")
    with open(output_path, "w", encoding="utf-8") as f:
        for session in sessions:
            # Format as OpenAI conversational format
            # {"messages": [{"role": "user", "name": "Usuario_1", "content": "..."}]}
            formatted_messages = []
            for msg in session:
                formatted_messages.append({
                    "role": "user",
                    "name": msg["sender"],
                    "content": msg["content"]
                })
            f.write(json.dumps({"messages": formatted_messages}, ensure_ascii=False) + "\n")
            
    print("Done! Cleaned chat export saved.")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Clean WhatsApp chat export for LLM training.")
    parser.add_argument("--input", default="Chat de WhatsApp con Cotorra.txt", help="Path to input WhatsApp chat TXT file")
    parser.add_argument("--output", default="Chat_de_WhatsApp_con_Cotorra_cleaned.jsonl", help="Path to output JSONL file")
    parser.add_argument("--gap", type=float, default=3.0, help="Inactivity gap in hours to split sessions")
    parser.add_argument("--maxlen", type=int, default=50, help="Maximum messages per session")
    
    args = parser.parse_args()
    process_chat(args.input, args.output, args.gap, args.maxlen)
```

- [ ] **Step 2: Run all tests to make sure everything passes**

Run: `python -m unittest scripts/test_clean_chat.py`
Expected: PASS

- [ ] **Step 3: Execute the script on the actual Chat Export**

Run: `python scripts/clean_chat.py --input "Chat de WhatsApp con Cotorra.txt" --output "Chat_de_WhatsApp_con_Cotorra_cleaned.jsonl"`
Expected: Success logs and output of the file `Chat_de_WhatsApp_con_Cotorra_cleaned.jsonl`.
Check size of the generated `.jsonl` file.
