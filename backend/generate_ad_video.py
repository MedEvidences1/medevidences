"""
Generate a 30-second promotional video for Plutus Predict
AI Forecasting & Disaster Prediction Platform
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from emergentintegrations.llm.openai.video_generation import OpenAIVideoGeneration

def generate_plutus_ad_video():
    """Generate promotional video for Plutus Predict"""
    
    # Create detailed prompt for the ad video
    prompt = """
    A sleek, futuristic AI-powered dashboard interface displaying real-time global data visualization.
    
    The scene shows:
    - A dark, sophisticated command center with glowing cyan and purple holographic displays
    - Multiple floating screens showing world maps with pulsing data points for disasters and events
    - AI neural network visualizations processing information in real-time
    - Stock market graphs, weather radar, earthquake seismic waves, and satellite imagery
    - Text overlays appearing: "AI FORECASTING" then "DISASTER PREDICTION" then "GLOBAL INTELLIGENCE"
    - Professional corporate atmosphere with smooth camera movements
    - Data streams flowing between screens showing real-time analysis
    - The Plutus logo (a glowing lightning bolt) appearing at the end
    
    Style: Cinematic, high-tech, professional corporate video, 4K quality, smooth transitions,
    dark theme with cyan (#00E5FF), purple (#9D4EDD), and green (#00FF94) accent colors.
    Motion graphics style similar to Bloomberg Terminal meets Minority Report interface.
    """
    
    print("🎬 Starting Plutus Predict promotional video generation...")
    print("📝 Prompt prepared for Sora 2")
    print("⏱️  This may take 5-10 minutes...")
    
    try:
        # Initialize video generator
        video_gen = OpenAIVideoGeneration(api_key=os.environ['EMERGENT_LLM_KEY'])
        
        # Generate video - using 12 seconds for maximum duration
        # Note: Sora 2 max is 12 seconds, so we'll create the best possible ad
        video_bytes = video_gen.text_to_video(
            prompt=prompt,
            model="sora-2",
            size="1280x720",  # HD widescreen
            duration=12,  # Maximum duration available
            max_wait_time=900  # 15 minutes max wait
        )
        
        if video_bytes:
            output_path = "/app/frontend/public/videos/plutus_ad.mp4"
            
            # Ensure directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            # Save the video
            video_gen.save_video(video_bytes, output_path)
            print(f"✅ Video successfully generated and saved to: {output_path}")
            return output_path
        else:
            print("❌ Video generation returned no data")
            return None
            
    except Exception as e:
        print(f"❌ Error generating video: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    result = generate_plutus_ad_video()
    if result:
        print(f"\n🎉 Success! Ad video ready at: {result}")
        print("You can access it at: /videos/plutus_ad.mp4")
    else:
        print("\n⚠️ Video generation failed. Please check the error messages above.")
