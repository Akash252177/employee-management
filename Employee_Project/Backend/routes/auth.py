import random
import string
from flask import Flask, request, jsonify
from flask_cors import CORS
import mailtrap as mt

# Initialize Flask app
app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

# Function to generate a random OTP (6-digit)
def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

# Function to send OTP email via Mailtrap
def send_otp_email(to_email, otp_code):
    mail = mt.Mail(
        sender=mt.Address(email="hello@demomailtrap.co", name="Mailtrap Test"),
        to=[mt.Address(email=to_email)],
        subject="Your OTP Code",
        text=f"Here is your OTP code: {otp_code}",
        category="Forgot Password OTP"
    )

    client = mt.MailtrapClient(token="6fdcd5e50393a684ede49a7285793e2e")
    response = client.send(mail)
    return response

@app.route('/forgot_password', methods=['POST'])
def forgot_password():
    email = request.json.get('email')

    # Generate a random OTP code
    otp_code = generate_otp()

    try:
        # Send OTP email
        send_otp_email(email, otp_code)
        return jsonify({"message": "OTP sent successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
