import cv2
import numpy as np
import face_recognition
import tensorflow as tf
from datetime import datetime

class AIProctor:
    def __init__(self):
        # Initialize face detection model
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # Initialize behavior detection model
        self.behavior_model = self._load_behavior_model()
        
        # Initialize movement tracking
        self.previous_face_location = None
        self.movement_threshold = 50
        
        # Violation tracking
        self.violations = []
        self.violation_threshold = 3
        
    def _load_behavior_model(self):
        # Load pre-trained behavior detection model
        # This would be your custom model for detecting suspicious behaviors
        return tf.keras.models.load_model('path_to_behavior_model')
    
    def process_frame(self, frame):
        """
        Process a single frame from the webcam feed
        """
        violations = []
        
        # Convert frame to RGB for face_recognition
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Detect faces
        face_locations = face_recognition.face_locations(rgb_frame)
        
        # Check number of faces
        if len(face_locations) == 0:
            violations.append({
                'type': 'face_not_detected',
                'severity': 'high',
                'timestamp': datetime.now()
            })
        elif len(face_locations) > 1:
            violations.append({
                'type': 'multiple_faces',
                'severity': 'high',
                'timestamp': datetime.now()
            })
        
        # Track face movement
        if len(face_locations) == 1:
            current_face = face_locations[0]
            if self.previous_face_location:
                movement = self._calculate_movement(current_face, self.previous_face_location)
                if movement > self.movement_threshold:
                    violations.append({
                        'type': 'suspicious_movement',
                        'severity': 'medium',
                        'details': {'movement_distance': movement},
                        'timestamp': datetime.now()
                    })
            self.previous_face_location = current_face
        
        return violations
    
    def _calculate_movement(self, current_face, previous_face):
        """
        Calculate the movement distance between two face positions
        """
        current_center = ((current_face[0] + current_face[2])/2, (current_face[1] + current_face[3])/2)
        previous_center = ((previous_face[0] + previous_face[2])/2, (previous_face[1] + previous_face[3])/2)
        
        return np.sqrt(
            (current_center[0] - previous_center[0])**2 + 
            (current_center[1] - previous_center[1])**2
        )
    
    def detect_tab_switching(self, window_state):
        """
        Monitor tab switching and window focus
        """
        if not window_state.is_focused:
            return {
                'type': 'tab_switch',
                'severity': 'medium',
                'timestamp': datetime.now(),
                'details': {
                    'window_title': window_state.title,
                    'duration': window_state.unfocused_duration
                }
            }
        return None
    
    def detect_audio_anomalies(self, audio_data):
        """
        Monitor audio for suspicious sounds or voices
        """
        # Implement audio analysis logic here
        pass
    
    def save_screenshot(self, frame, violation_type):
        """
        Save a screenshot when a violation is detected
        """
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'violation_{violation_type}_{timestamp}.jpg'
        cv2.imwrite(f'screenshots/{filename}', frame)
        return filename
    
    def analyze_session(self, session_data):
        """
        Analyze the entire session for patterns of suspicious behavior
        """
        violation_counts = {}
        total_violations = 0
        
        for violation in session_data['violations']:
            violation_type = violation['type']
            violation_counts[violation_type] = violation_counts.get(violation_type, 0) + 1
            total_violations += 1
        
        session_analysis = {
            'total_violations': total_violations,
            'violation_breakdown': violation_counts,
            'suspicious_level': self._calculate_suspicious_level(total_violations),
            'recommendations': self._generate_recommendations(violation_counts)
        }
        
        return session_analysis
    
    def _calculate_suspicious_level(self, total_violations):
        """
        Calculate the overall suspicious level of the session
        """
        if total_violations >= self.violation_threshold * 2:
            return 'high'
        elif total_violations >= self.violation_threshold:
            return 'medium'
        return 'low'
    
    def _generate_recommendations(self, violation_counts):
        """
        Generate recommendations based on the types of violations
        """
        recommendations = []
        
        if violation_counts.get('face_not_detected', 0) > 2:
            recommendations.append('Ensure proper lighting and camera positioning')
        
        if violation_counts.get('multiple_faces', 0) > 0:
            recommendations.append('Ensure only the candidate is present in the frame')
        
        if violation_counts.get('tab_switch', 0) > 3:
            recommendations.append('Minimize switching between applications during the assessment')
        
        return recommendations

# Example usage:
"""
proctor = AIProctor()

# In a video feed loop:
while True:
    ret, frame = video_capture.read()
    violations = proctor.process_frame(frame)
    
    if violations:
        for violation in violations:
            screenshot_url = proctor.save_screenshot(frame, violation['type'])
            violation['screenshot_url'] = screenshot_url
            
        # Send violations to the main application
        send_violations_to_database(violations)
    
    # Check for tab switching
    window_state = get_window_state()
    tab_violation = proctor.detect_tab_switching(window_state)
    if tab_violation:
        send_violations_to_database([tab_violation])
"""