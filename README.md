# Allard VP Workshop - Voting Platform

A modern, responsive web application for the Virtual Production Workshop, featuring environment voting, script idea submission, and community engagement.

## Features

- **Environment Voting**: Participants can vote for their preferred virtual locations (choose 2 out of 6 available)
- **Script Ideas**: Submit and vote on creative script ideas for the workshop
- **Real-time Updates**: Live vote counts and new submissions without page refresh
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark/Light Theme**: Automatically syncs with device theme preference
- **Modern UI**: Built with Tailwind CSS for a clean, professional appearance
- **No Authentication Required**: Simple session-based tracking for ease of use

## Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Cloudflare Pages
- **Real-time**: Supabase Realtime subscriptions

## Database Schema

### Tables

1. **environments**: Virtual locations available for voting
   - `id` (text): Unique identifier (matches storage bucket name)
   - `name` (text): Display name
   - `emoji` (text): Emoji representation
   - `description` (text): Description of the environment
   - `created_at` (timestamp): Creation date

2. **votes**: User votes for environments and script ideas
   - `id` (uuid): Unique vote identifier
   - `voter_session` (text): Anonymous user session identifier
   - `vote_type` (text): Either 'environment' or 'script'
   - `target_id` (text): ID of the voted item
   - `voted_at` (timestamp): Vote timestamp

3. **script_ideas**: User-submitted script ideas
   - `id` (uuid): Unique idea identifier
   - `idea` (text): The script idea content
   - `author_session` (text): Anonymous author session identifier
   - `created_at` (timestamp): Submission date

## Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/AllardVP/workshop_page.git
   cd workshop_page
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Deployment

### Cloudflare Pages

1. Connect your GitHub repository to Cloudflare Pages
2. Set the build command to: `npm run build`
3. Set the build output directory to: `dist`
4. Add environment variables in Cloudflare Pages dashboard:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
5. Deploy automatically on every push to main branch

### Environment Variables

The following environment variables are required:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key (safe for public use)

## Usage

### For Participants

1. **Watch the Introduction Video**: Learn about virtual production basics
2. **Vote for Environments**: Select exactly 2 virtual locations you'd like to work with
3. **Submit Script Ideas**: Share your creative ideas for the workshop
4. **Vote on Scripts**: Support script ideas from other participants

### For Organizers

- Monitor votes and script ideas through the Supabase dashboard
- Top 2 voted environments will be prepared for the workshop
- Use script ideas to guide workshop activities

## Features in Detail

### Environment Voting
- Users can select exactly 2 out of 6 available virtual environments
- Real-time vote counting with live updates
- Prevents duplicate voting per session
- Visual feedback with hover effects and selection states
- **Camera icon** on each environment card opens image carousel

### Image Carousel
- Click the camera icon (📷) on any environment card to view images
- Loads images dynamically from Supabase storage buckets
- Smooth carousel navigation with keyboard support (arrow keys)
- Responsive design with loading states and error handling
- Modal overlay with environment details
- Supports JPG, PNG, GIF, and WebP formats

### Script Ideas
- 500 character limit for focused, concise ideas
- Real-time submission and display
- Heart-based voting system for script ideas
- Prevents duplicate voting per session

### Session Management
- Anonymous sessions using localStorage
- Persistent across browser sessions
- Prevents vote manipulation while maintaining privacy

### Responsive Design
- Mobile-first approach with Tailwind CSS
- Adaptive grid layouts (grid on desktop, column on mobile)
- Optimized for all screen sizes
- Touch-friendly interface elements

## Supabase Storage Setup

### Creating Environment Image Buckets

1. **Create Storage Bucket**:
   - Go to your Supabase dashboard → Storage
   - Create a new bucket named `environments`
   - Make it public for image access

2. **Upload Images**:
   - Create folders matching your environment IDs (e.g., `envir01`, `envir02`)
   - Upload images to each folder
   - Supported formats: JPG, JPEG, PNG, GIF, WebP

3. **File Structure**:
   ```
   environments/
   ├── envir01/
   │   ├── rome-1.jpg
   │   ├── rome-2.jpg
   │   └── rome-3.jpg
   ├── envir02/
   │   ├── cyberpunk-1.jpg
   │   └── cyberpunk-2.jpg
   └── envir03/
       ├── beach-1.jpg
       ├── beach-2.jpg
       └── beach-3.jpg
   ```

4. **Bucket Policies**:
   - Set bucket to public read access
   - Or configure RLS policies for controlled access

## Browser Support

- Chrome/Chromium 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions or support, please contact the Allard VP team or create an issue in the GitHub repository. 