import os
import sqlite3
import json
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "lung_cancer.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # 1. Patients Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id TEXT UNIQUE NOT NULL,
        name TEXT,
        age INTEGER,
        gender TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    # 2. Analysis Sessions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS analysis_sessions (
        session_id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        original_image_name TEXT,
        original_image_path TEXT,
        file_size_bytes INTEGER,
        file_type TEXT,
        status TEXT DEFAULT 'created',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    # 3. CNN Predictions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cnn_predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE NOT NULL,
        cancer_probability REAL NOT NULL,
        predicted_class TEXT NOT NULL,
        predicted_stage TEXT NOT NULL,
        stage_probabilities_json TEXT,
        inference_time_ms REAL,
        model_status TEXT,
        embedding_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES analysis_sessions(session_id)
    );
    """)
    
    # 4. Grad-CAM Results
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS gradcam_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE NOT NULL,
        original_url TEXT,
        heatmap_url TEXT,
        overlay_url TEXT,
        salient_box_json TEXT,
        salient_circle_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES analysis_sessions(session_id)
    );
    """)
    
    # 5. Counterfactual Results
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS counterfactual_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        mode TEXT NOT NULL,
        strength TEXT NOT NULL,
        modified_image_url TEXT,
        original_probability REAL,
        counterfactual_probability REAL,
        probability_difference REAL,
        percentage_change REAL,
        original_predicted_stage TEXT,
        counterfactual_predicted_stage TEXT,
        trend TEXT,
        description TEXT,
        chart_data_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES analysis_sessions(session_id)
    );
    """)
    
    # 6. Progression Records
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS progression_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        baseline_date TEXT,
        interim_date TEXT,
        current_date TEXT,
        results_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES analysis_sessions(session_id)
    );
    """)
    
    # 7. Reports Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_id TEXT UNIQUE NOT NULL,
        session_id TEXT NOT NULL,
        patient_id TEXT NOT NULL,
        pdf_path TEXT,
        pdf_filename TEXT,
        report_data_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES analysis_sessions(session_id)
    );
    """)
    
    conn.commit()
    conn.close()
    print("[Database] Initialized SQLite tables successfully.")

# Helper queries
def save_patient(patient_id: str, name: str = "Anonymous Patient", age: int = 58, gender: str = "Unspecified"):
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
    INSERT OR IGNORE INTO patients (patient_id, name, age, gender)
    VALUES (?, ?, ?, ?)
    """, (patient_id, name, age, gender))
    conn.commit()
    conn.close()

def save_session(session_id: str, patient_id: str, filename: str, filepath: str, filesize: int, filetype: str):
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
    INSERT OR REPLACE INTO analysis_sessions 
    (session_id, patient_id, original_image_name, original_image_path, file_size_bytes, file_type, status)
    VALUES (?, ?, ?, ?, ?, ?, 'uploaded')
    """, (session_id, patient_id, filename, filepath, filesize, filetype))
    conn.commit()
    conn.close()

def get_session(session_id: str):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM analysis_sessions WHERE session_id = ?", (session_id,))
    row = c.fetchone()
    conn.close()
    return dict(row) if row else None

def save_cnn_prediction(session_id: str, cancer_prob: float, pred_class: str, pred_stage: str, stage_probs: dict, time_ms: float, status: str, embedding: list):
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
    INSERT OR REPLACE INTO cnn_predictions 
    (session_id, cancer_probability, predicted_class, predicted_stage, stage_probabilities_json, inference_time_ms, model_status, embedding_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (session_id, cancer_prob, pred_class, pred_stage, json.dumps(stage_probs), time_ms, status, json.dumps(embedding)))
    c.execute("UPDATE analysis_sessions SET status = 'cnn_analyzed' WHERE session_id = ?", (session_id,))
    conn.commit()
    conn.close()

def get_cnn_prediction(session_id: str):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM cnn_predictions WHERE session_id = ?", (session_id,))
    row = c.fetchone()
    conn.close()
    if row:
        d = dict(row)
        d["stage_probabilities"] = json.loads(d["stage_probabilities_json"]) if d["stage_probabilities_json"] else {}
        d["embedding"] = json.loads(d["embedding_json"]) if d["embedding_json"] else []
        return d
    return None

def save_gradcam(session_id: str, orig_url: str, hm_url: str, ov_url: str, sbox: dict, scircle: dict):
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
    INSERT OR REPLACE INTO gradcam_results 
    (session_id, original_url, heatmap_url, overlay_url, salient_box_json, salient_circle_json)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (session_id, orig_url, hm_url, ov_url, json.dumps(sbox), json.dumps(scircle)))
    c.execute("UPDATE analysis_sessions SET status = 'gradcam_ready' WHERE session_id = ?", (session_id,))
    conn.commit()
    conn.close()

def get_gradcam(session_id: str):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM gradcam_results WHERE session_id = ?", (session_id,))
    row = c.fetchone()
    conn.close()
    if row:
        d = dict(row)
        d["salient_box"] = json.loads(d["salient_box_json"]) if d["salient_box_json"] else None
        d["salient_circle"] = json.loads(d["salient_circle_json"]) if d["salient_circle_json"] else None
        return d
    return None

def save_counterfactual(session_id: str, mode: str, strength: str, cf_data: dict):
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
    INSERT INTO counterfactual_results 
    (session_id, mode, strength, modified_image_url, original_probability, counterfactual_probability, 
     probability_difference, percentage_change, original_predicted_stage, counterfactual_predicted_stage, 
     trend, description, chart_data_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        session_id, mode, strength, cf_data["modified_image_url"],
        cf_data["original_probability"], cf_data["counterfactual_probability"],
        cf_data["probability_difference"], cf_data["percentage_change"],
        cf_data["original_predicted_stage"], cf_data["counterfactual_predicted_stage"],
        cf_data["trend"], cf_data["description"], json.dumps(cf_data["comparison_chart_data"])
    ))
    conn.commit()
    conn.close()

def get_latest_counterfactual(session_id: str):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM counterfactual_results WHERE session_id = ? ORDER BY id DESC LIMIT 1", (session_id,))
    row = c.fetchone()
    conn.close()
    if row:
        d = dict(row)
        d["comparison_chart_data"] = json.loads(d["chart_data_json"]) if d["chart_data_json"] else []
        return d
    return None

def save_progression(session_id: str, baseline_date: str, interim_date: str, current_date: str, results_dict: dict):
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
    INSERT INTO progression_records 
    (session_id, baseline_date, interim_date, current_date, results_json)
    VALUES (?, ?, ?, ?, ?)
    """, (session_id, baseline_date, interim_date, current_date, json.dumps(results_dict)))
    conn.commit()
    conn.close()

def get_latest_progression(session_id: str):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM progression_records WHERE session_id = ? ORDER BY id DESC LIMIT 1", (session_id,))
    row = c.fetchone()
    conn.close()
    if row:
        d = dict(row)
        d["results"] = json.loads(d["results_json"]) if d["results_json"] else {}
        return d
    return None

def save_report_meta(report_id: str, session_id: str, patient_id: str, pdf_path: str, pdf_filename: str, report_data: dict):
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
    INSERT OR REPLACE INTO reports 
    (report_id, session_id, patient_id, pdf_path, pdf_filename, report_data_json)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (report_id, session_id, patient_id, pdf_path, pdf_filename, json.dumps(report_data)))
    conn.commit()
    conn.close()

def get_all_reports():
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT report_id, session_id, patient_id, pdf_filename, created_at FROM reports ORDER BY id DESC")
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_report_by_id(report_id: str):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM reports WHERE report_id = ?", (report_id,))
    row = c.fetchone()
    conn.close()
    if row:
        d = dict(row)
        d["report_data"] = json.loads(d["report_data_json"]) if d["report_data_json"] else {}
        return d
    return None

