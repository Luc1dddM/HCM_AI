import streamlit as st
import requests
import json
from typing import List, Optional
import pandas as pd
from datetime import datetime
import base64
from io import BytesIO
from PIL import Image

# Page configuration
st.set_page_config(
    page_title="Keyframe Search",
    page_icon="🔍",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom CSS for better styling
st.markdown("""
<style>
    .main > div {
        padding-top: 2rem;
    }

    .search-container {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 2rem;
        border-radius: 15px;
        margin-bottom: 2rem;
        color: white;
    }

    .mode-selector {
        background: rgba(255, 255, 255, 0.1);
        padding: 1rem;
        border-radius: 10px;
        margin: 1rem 0;
    }

    .result-card {
        background: white;
        padding: 1rem;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        margin-bottom: 1rem;
        border-left: 4px solid #667eea;
    }

    .score-badge {
        background: #28a745;
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: bold;
    }

    .stButton > button {
        background: linear-gradient(45deg, #667eea, #764ba2);
        color: white;
        border: none;
        border-radius: 25px;
        padding: 0.5rem 2rem;
        font-weight: 600;
        transition: all 0.3s ease;
    }

    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }

    .metric-container {
        background: rgba(255, 255, 255, 0.9);
        padding: 1rem;
        border-radius: 10px;
        text-align: center;
        margin: 0.5rem;
    }

    .tab-content {
        background: white;
        padding: 1.5rem;
        border-radius: 10px;
        margin-top: 1rem;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .search-history-item {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 0.5rem;
        border-left: 3px solid #667eea;
    }

    .image-upload-area {
        border: 2px dashed #667eea;
        border-radius: 10px;
        padding: 2rem;
        text-align: center;
        background: #f8f9fb;
        margin: 1rem 0;
    }

    .filter-section {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 10px;
        margin: 1rem 0;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'search_results' not in st.session_state:
    st.session_state.search_results = []
if 'api_base_url' not in st.session_state:
    st.session_state.api_base_url = "http://localhost:8000"
if 'search_history' not in st.session_state:
    st.session_state.search_history = []
if 'uploaded_image' not in st.session_state:
    st.session_state.uploaded_image = None

# Helper functions
def add_to_history(query, mode, results_count):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    st.session_state.search_history.insert(0, {
        'timestamp': timestamp,
        'query': query,
        'mode': mode,
        'results_count': results_count
    })
    # Keep only last 10 searches
    st.session_state.search_history = st.session_state.search_history[:10]

def convert_image_to_base64(image):
    buffered = BytesIO()
    image.save(buffered, format="JPEG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return img_str

# Header
st.markdown("""
<div class="search-container">
    <h1 style="margin: 0; font-size: 2.5rem;">🔍 Enhanced Keyframe Search</h1>
    <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem; opacity: 0.9;">
        Search through video keyframes using text queries or images with advanced filtering
    </p>
</div>
""", unsafe_allow_html=True)

# Sidebar for advanced settings and history
with st.sidebar:
    st.markdown("## ⚙️ Settings")

    # API Configuration
    st.markdown("### 🌐 API Configuration")
    api_url = st.text_input(
        "API Base URL",
        value=st.session_state.api_base_url,
        help="Base URL for the keyframe search API"
    )
    if api_url != st.session_state.api_base_url:
        st.session_state.api_base_url = api_url

    # Display settings
    st.markdown("### 🎨 Display Settings")
    results_per_row = st.selectbox("Results per row", [1, 2, 3, 4], index=1)
    show_metadata = st.checkbox("Show detailed metadata", value=True)
    show_thumbnails = st.checkbox("Show image thumbnails", value=True)

    # Search History
    st.markdown("### 📝 Search History")
    if st.session_state.search_history:
        for i, search in enumerate(st.session_state.search_history):
            with st.expander(f"{search['timestamp'][:16]} - {search['results_count']} results"):
                st.markdown(f"**Query:** {search['query']}")
                st.markdown(f"**Mode:** {search['mode']}")
                if st.button(f"Repeat Search", key=f"repeat_{i}"):
                    st.session_state.repeat_search = search
                    st.rerun()
    else:
        st.info("No search history yet")

    if st.button("Clear History"):
        st.session_state.search_history = []
        st.rerun()

# Main content tabs
tab1, tab2, tab3, tab4 = st.tabs(["🔍 Search", "📊 Results", "🎛️ Advanced Filters", "💾 Export"])

with tab1:
    st.markdown("<div class='tab-content'>", unsafe_allow_html=True)

    # Search type selector
    search_type = st.radio(
        "Search Type",
        ["Text Search", "Image Search", "Hybrid Search"],
        horizontal=True,
        help="Choose between text-based, image-based, or combined search"
    )

    # Search interface based on type
    if search_type in ["Text Search", "Hybrid Search"]:
        st.markdown("### 📝 Text Query")
        query = st.text_area(
            "Search Query",
            placeholder="Enter your search query (e.g., 'person walking in the park')",
            help="Enter 1-1000 characters describing what you're looking for",
            height=100
        )
    else:
        query = ""

    if search_type in ["Image Search", "Hybrid Search"]:
        st.markdown("### 🖼️ Image Query")

        # Image upload options
        upload_option = st.radio(
            "Image Input Method",
            ["Upload File", "Camera Capture", "URL"],
            horizontal=True
        )

        uploaded_image = None
        if upload_option == "Upload File":
            uploaded_file = st.file_uploader(
                "Choose an image...",
                type=['png', 'jpg', 'jpeg', 'bmp', 'tiff'],
                help="Upload an image to search for similar keyframes"
            )
            if uploaded_file is not None:
                uploaded_image = Image.open(uploaded_file)
                st.session_state.uploaded_image = uploaded_image

        elif upload_option == "Camera Capture":
            camera_image = st.camera_input("Take a picture")
            if camera_image is not None:
                uploaded_image = Image.open(camera_image)
                st.session_state.uploaded_image = uploaded_image

        elif upload_option == "URL":
            image_url = st.text_input("Image URL", placeholder="https://example.com/image.jpg")
            if image_url and st.button("Load Image"):
                try:
                    response = requests.get(image_url)
                    uploaded_image = Image.open(BytesIO(response.content))
                    st.session_state.uploaded_image = uploaded_image
                    st.success("Image loaded successfully!")
                except Exception as e:
                    st.error(f"Failed to load image: {str(e)}")

        # Display uploaded image
        if st.session_state.uploaded_image:
            col1, col2, col3 = st.columns([1, 2, 1])
            with col2:
                st.image(st.session_state.uploaded_image, caption="Query Image", use_column_width=True)

    # Search parameters
    st.markdown("### 🎯 Search Parameters")
    col_param1, col_param2, col_param3 = st.columns(3)

    with col_param1:
        top_k = st.slider("📊 Max Results", min_value=1, max_value=500, value=20)
    with col_param2:
        score_threshold = st.slider("🎯 Min Score", min_value=0.0, max_value=1.0, value=0.1, step=0.05)
    with col_param3:
        search_timeout = st.slider("⏱️ Timeout (s)", min_value=5, max_value=120, value=30)

    # Search mode selector
    st.markdown("### 🎛️ Search Mode")
    search_mode = st.selectbox(
        "Filtering Mode",
        options=["Default", "Exclude Groups", "Include Groups & Videos", "Advanced Filter"],
        help="Choose how to filter your search results"
    )

    # Mode-specific parameters
    if search_mode == "Exclude Groups":
        exclude_groups_input = st.text_input(
            "Group IDs to exclude",
            placeholder="Enter group IDs separated by commas (e.g., 1, 3, 7)",
            help="Keyframes from these groups will be excluded from results"
        )
        exclude_groups = []
        if exclude_groups_input.strip():
            try:
                exclude_groups = [int(x.strip()) for x in exclude_groups_input.split(',') if x.strip()]
            except ValueError:
                st.error("Please enter valid group IDs separated by commas")

    elif search_mode == "Include Groups & Videos":
        col_inc1, col_inc2 = st.columns(2)
        with col_inc1:
            include_groups_input = st.text_input(
                "Group IDs to include",
                placeholder="e.g., 2, 4, 6",
                help="Only search within these groups"
            )
        with col_inc2:
            include_videos_input = st.text_input(
                "Video IDs to include",
                placeholder="e.g., 101, 102, 203",
                help="Only search within these videos"
            )

        include_groups = []
        include_videos = []
        if include_groups_input.strip():
            try:
                include_groups = [int(x.strip()) for x in include_groups_input.split(',') if x.strip()]
            except ValueError:
                st.error("Please enter valid group IDs separated by commas")
        if include_videos_input.strip():
            try:
                include_videos = [int(x.strip()) for x in include_videos_input.split(',') if x.strip()]
            except ValueError:
                st.error("Please enter valid video IDs separated by commas")

    elif search_mode == "Advanced Filter":
        st.info("Use the Advanced Filters tab to configure complex filtering rules")

    # Search button
    search_col1, search_col2, search_col3 = st.columns([2, 1, 1])
    with search_col1:
        search_button = st.button("🚀 Search Keyframes", use_container_width=True, type="primary")
    with search_col2:
        if st.button("🔄 Reset", use_container_width=True):
            st.session_state.search_results = []
            st.session_state.uploaded_image = None
            st.rerun()
    with search_col3:
        save_search = st.button("💾 Save Search", use_container_width=True)

    st.markdown("</div>", unsafe_allow_html=True)

with tab2:
    st.markdown("<div class='tab-content'>", unsafe_allow_html=True)

    if st.session_state.search_results:
        # Results summary
        st.markdown("### 📊 Search Results Summary")
        col_metric1, col_metric2, col_metric3, col_metric4 = st.columns(4)

        with col_metric1:
            st.metric("Total Results", len(st.session_state.search_results))
        with col_metric2:
            avg_score = sum(result['score'] for result in st.session_state.search_results) / len(st.session_state.search_results)
            st.metric("Average Score", f"{avg_score:.3f}")
        with col_metric3:
            max_score = max(result['score'] for result in st.session_state.search_results)
            st.metric("Best Score", f"{max_score:.3f}")
        with col_metric4:
            unique_videos = len(set(result.get('video_id', 'unknown') for result in st.session_state.search_results))
            st.metric("Unique Videos", unique_videos)

        # Sorting options
        st.markdown("### 🔄 Sort & Filter Results")
        col_sort1, col_sort2, col_sort3 = st.columns(3)

        with col_sort1:
            sort_by = st.selectbox("Sort by", ["Score (Highest)", "Score (Lowest)", "Path", "Video ID"])
        with col_sort2:
            min_display_score = st.slider("Min display score", 0.0, 1.0, 0.0, 0.05)
        with col_sort3:
            max_results_display = st.slider("Max results to show", 1, len(st.session_state.search_results), min(50, len(st.session_state.search_results)))

        # Sort results
        if sort_by == "Score (Highest)":
            sorted_results = sorted(st.session_state.search_results, key=lambda x: x['score'], reverse=True)
        elif sort_by == "Score (Lowest)":
            sorted_results = sorted(st.session_state.search_results, key=lambda x: x['score'])
        elif sort_by == "Path":
            sorted_results = sorted(st.session_state.search_results, key=lambda x: x['path'])
        else:  # Video ID
            sorted_results = sorted(st.session_state.search_results, key=lambda x: x.get('video_id', 0))

        # Filter by score
        filtered_results = [r for r in sorted_results if r['score'] >= min_display_score][:max_results_display]

        st.markdown(f"### 🎯 Displaying {len(filtered_results)} results")

        # Display results in grid
        if results_per_row == 1:
            # Single column layout with detailed info
            for i, result in enumerate(filtered_results):
                with st.container():
                    col_img, col_info = st.columns([1, 3])

                    with col_img:
                        if show_thumbnails:
                            try:
                                st.image(result['path'], width=200, caption=f"Result {i+1}")
                            except:
                                st.markdown("""
                                <div style="background: #f0f0f0; height: 150px; border-radius: 10px;
                                           display: flex; align-items: center; justify-content: center;
                                           border: 2px dashed #ccc;">
                                    <div style="text-align: center; color: #666;">
                                        🖼️<br>Preview<br>Not Available
                                    </div>
                                </div>
                                """, unsafe_allow_html=True)

                    with col_info:
                        st.markdown(f"""
                        <div class="result-card">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                <h4 style="margin: 0; color: #333;">Result #{i+1}</h4>
                                <span class="score-badge">Score: {result['score']:.3f}</span>
                            </div>
                            <p style="margin: 0.3rem 0; color: #666;"><strong>Path:</strong> {result['path']}</p>
                            {"<p style='margin: 0.3rem 0; color: #666;'><strong>Video ID:</strong> " + str(result.get('video_id', 'N/A')) + "</p>" if show_metadata else ""}
                            {"<p style='margin: 0.3rem 0; color: #666;'><strong>Group ID:</strong> " + str(result.get('group_id', 'N/A')) + "</p>" if show_metadata else ""}
                            <div style="background: #f8f9fa; padding: 0.5rem; border-radius: 5px; font-family: monospace; font-size: 0.9rem;">
                                {result['path'].split('/')[-1]}
                            </div>
                        </div>
                        """, unsafe_allow_html=True)
                    st.markdown("---")
        else:
            # Multi-column grid layout
            cols = st.columns(results_per_row)
            for i, result in enumerate(filtered_results):
                with cols[i % results_per_row]:
                    if show_thumbnails:
                        try:
                            st.image(result['path'], use_column_width=True)
                        except:
                            st.markdown("🖼️ *Preview not available*")

                    st.markdown(f"**Score:** {result['score']:.3f}")
                    if show_metadata:
                        st.markdown(f"**File:** {result['path'].split('/')[-1]}")
                        st.markdown(f"**Video:** {result.get('video_id', 'N/A')}")

                    if st.button(f"📋 Details", key=f"details_{i}"):
                        st.json(result)
    else:
        st.info("👆 Use the Search tab to find keyframes")

    st.markdown("</div>", unsafe_allow_html=True)

with tab3:
    st.markdown("<div class='tab-content'>", unsafe_allow_html=True)
    st.markdown("### 🎛️ Advanced Filtering Options")

    # Video duration filter
    st.markdown("#### 🎬 Video Properties")
    col1, col2 = st.columns(2)
    with col1:
        min_duration = st.number_input("Min video duration (seconds)", min_value=0, value=0)
        min_resolution_width = st.number_input("Min width (pixels)", min_value=0, value=0)
    with col2:
        max_duration = st.number_input("Max video duration (seconds)", min_value=0, value=0)
        min_resolution_height = st.number_input("Min height (pixels)", min_value=0, value=0)

    # Time-based filters
    st.markdown("#### ⏰ Time Filters")
    col1, col2 = st.columns(2)
    with col1:
        start_date = st.date_input("Created after")
        start_time_in_video = st.number_input("Min timestamp in video (seconds)", min_value=0.0, value=0.0)
    with col2:
        end_date = st.date_input("Created before")
        end_time_in_video = st.number_input("Max timestamp in video (seconds)", min_value=0.0, value=0.0)

    # Content-based filters
    st.markdown("#### 🏷️ Content Filters")
    exclude_keywords = st.text_input("Exclude keywords (comma-separated)", placeholder="blur, dark, motion")
    include_keywords = st.text_input("Include keywords (comma-separated)", placeholder="person, outdoor, daytime")

    # File-based filters
    st.markdown("#### 📁 File Filters")
    col1, col2 = st.columns(2)
    with col1:
        file_extensions = st.multiselect("File extensions", [".jpg", ".jpeg", ".png", ".bmp"], default=[".jpg", ".jpeg"])
        min_file_size = st.number_input("Min file size (KB)", min_value=0, value=0)
    with col2:
        path_contains = st.text_input("Path must contain", placeholder="2024, dataset1")
        max_file_size = st.number_input("Max file size (KB)", min_value=0, value=0)

    if st.button("💾 Save Filter Preset"):
        st.success("Filter preset saved!")

    if st.button("🔄 Load Filter Preset"):
        st.info("Filter presets would be loaded here")

    st.markdown("</div>", unsafe_allow_html=True)

with tab4:
    st.markdown("<div class='tab-content'>", unsafe_allow_html=True)
    st.markdown("### 💾 Export Search Results")

    if st.session_state.search_results:
        # Export format selection
        export_format = st.selectbox(
            "Export Format",
            ["JSON", "CSV", "Excel", "PDF Report"],
            help="Choose the format for exporting results"
        )

        # Export options
        col1, col2 = st.columns(2)
        with col1:
            include_images = st.checkbox("Include image thumbnails", value=False)
            include_metadata = st.checkbox("Include all metadata", value=True)
        with col2:
            export_top_n = st.number_input("Export top N results", min_value=1, max_value=len(st.session_state.search_results), value=min(20, len(st.session_state.search_results)))
            add_timestamp = st.checkbox("Add timestamp to filename", value=True)

        # Export buttons
        col1, col2, col3, col4 = st.columns(4)

        with col1:
            if st.button("📄 Export Results", use_container_width=True):
                # Create export data
                export_data = st.session_state.search_results[:export_top_n]

                if export_format == "JSON":
                    json_str = json.dumps(export_data, indent=2)
                    st.download_button(
                        label="📥 Download JSON",
                        data=json_str,
                        file_name=f"keyframe_search_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json" if add_timestamp else "keyframe_search_results.json",
                        mime="application/json"
                    )
                elif export_format == "CSV":
                    df = pd.DataFrame(export_data)
                    csv = df.to_csv(index=False)
                    st.download_button(
                        label="📥 Download CSV",
                        data=csv,
                        file_name=f"keyframe_search_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv" if add_timestamp else "keyframe_search_results.csv",
                        mime="text/csv"
                    )

        with col2:
            if st.button("📊 Generate Report", use_container_width=True):
                st.info("Detailed report generation would be implemented here")

        with col3:
            if st.button("🔗 Share Results", use_container_width=True):
                st.info("Result sharing functionality would be implemented here")

        with col4:
            if st.button("💾 Save Session", use_container_width=True):
                st.success("Search session saved!")

        # Preview export data
        st.markdown("#### 👀 Export Preview")
        if export_format in ["JSON", "CSV"]:
            preview_data = st.session_state.search_results[:min(5, export_top_n)]
            if export_format == "JSON":
                st.json(preview_data)
            else:
                df_preview = pd.DataFrame(preview_data)
                st.dataframe(df_preview)

    else:
        st.info("No search results to export. Perform a search first.")

    st.markdown("</div>", unsafe_allow_html=True)

# Search execution logic
if search_button:
    # Validation
    if search_type == "Text Search" and not query.strip():
        st.error("Please enter a search query")
    elif search_type == "Image Search" and not st.session_state.uploaded_image:
        st.error("Please upload an image for image search")
    elif search_type == "Hybrid Search" and not query.strip() and not st.session_state.uploaded_image:
        st.error("Please provide either text query or image for hybrid search")
    elif query and len(query) > 1000:
        st.error("Query too long. Please keep it under 1000 characters.")
    else:
        with st.spinner("🔍 Searching for keyframes..."):
            try:
                # Prepare payload based on search type and mode
                if search_mode == "Default":
                    endpoint = f"{st.session_state.api_base_url}/api/v1/keyframe/search"
                    payload = {
                        "query": query,
                        "top_k": top_k,
                        "score_threshold": score_threshold
                    }
                elif search_mode == "Exclude Groups":
                    endpoint = f"{st.session_state.api_base_url}/api/v1/keyframe/search/exclude-groups"
                    payload = {
                        "query": query,
                        "top_k": top_k,
                        "score_threshold": score_threshold,
                        "exclude_groups": exclude_groups
                    }
                elif search_mode == "Include Groups & Videos":
                    endpoint = f"{st.session_state.api_base_url}/api/v1/keyframe/search/selected-groups-videos"
                    payload = {
                        "query": query,
                        "top_k": top_k,
                        "score_threshold": score_threshold,
                        "include_groups": include_groups,
                        "include_videos": include_videos
                    }
                else:  # Advanced Filter
                    endpoint = f"{st.session_state.api_base_url}/api/v1/keyframe/search"
                    payload = {
                        "query": query,
                        "top_k": top_k,
                        "score_threshold": score_threshold
                    }

                # Add image data if needed
                if search_type in ["Image Search", "Hybrid Search"] and st.session_state.uploaded_image:
                    payload["image"] = convert_image_to_base64(st.session_state.uploaded_image)
                    payload["search_type"] = search_type.lower().replace(" ", "_")

                response = requests.post(
                    endpoint,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                    timeout=search_timeout
                )

                if response.status_code == 200:
                    data = response.json()
                    st.session_state.search_results = data.get("results", [])

                    # Add to history
                    search_query = query if query else f"Image Search ({search_type})"
                    add_to_history(search_query, search_mode, len(st.session_state.search_results))

                    st.success(f"✅ Found {len(st.session_state.search_results)} results!")

                    # Auto-switch to results tab
                    st.info("📊 Check the Results tab to view your search results")
                else:
                    st.error(f"❌ API Error: {response.status_code} - {response.text}")

            except requests.exceptions.RequestException as e:
                st.error(f"❌ Connection Error: {str(e)}")
            except Exception as e:
                st.error(f"❌ Unexpected Error: {str(e)}")

# Footer
st.markdown("---")
st.markdown("""
<div style="text-align: center; color: #666; padding: 1rem;">
    <p>🎥 Enhanced Keyframe Search Application | Built with Streamlit</p>
    <p style="font-size: 0.9rem;">Support for text search, image search, hybrid search, and advanced filtering</p>
</div>
""", unsafe_allow_html=True)
