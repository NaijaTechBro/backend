import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Template from '../models/Template';
import Example from '../models/Example';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pitch-deck-builder')
  .then(() => {
    console.log('Connected to MongoDB');
    seedTemplates()
      .then(() => {
        console.log('Template seeding completed');
        return seedExamples();
      })
      .then(() => {
        console.log('Examples seeding completed');
        mongoose.disconnect();
      })
      .catch(err => {
        console.error('Seeding error:', err);
        mongoose.disconnect();
      });
  })
  .catch(err => console.error('Could not connect to MongoDB', err));

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getTemplateContentForSector(sector, slideType) {
  switch (slideType) {
    case 'problem':
      const problemContent = {
        fintech: `<h2>The Problem</h2>
        <div class="two-column">
          <div class="left-column">
            <p>African financial markets face significant challenges:</p>
            <ul>
              <li>Over 350 million unbanked adults across the continent</li>
              <li>High transaction costs for cross-border payments</li>
              <li>Limited access to credit for SMEs and individuals</li>
              <li>Fragmented payment systems across different countries</li>
            </ul>
          </div>
          <div class="right-column">
            <div class="image-placeholder">[Visual representation of the problem]</div>
          </div>
        </div>`,
        
        agritech: `<h2>The Problem</h2>
        <div class="two-column">
          <div class="left-column">
            <p>African agriculture faces critical challenges:</p>
            <ul>
              <li>Smallholder farmers lack access to markets and fair prices</li>
              <li>Limited access to agricultural inputs and financing</li>
              <li>Supply chain inefficiencies leading to post-harvest losses</li>
              <li>Unpredictable weather patterns affecting crop yields</li>
            </ul>
          </div>
          <div class="right-column">
            <div class="image-placeholder">[Visual representation of the problem]</div>
          </div>
        </div>`,
        
        healthtech: `<h2>The Problem</h2>
        <div class="two-column">
          <div class="left-column">
            <p>Healthcare delivery in Africa faces significant challenges:</p>
            <ul>
              <li>Shortage of healthcare professionals (doctor-to-patient ratio)</li>
              <li>Limited access to quality healthcare in rural areas</li>
              <li>High cost of medical services relative to income</li>
              <li>Inefficient health record management systems</li>
            </ul>
          </div>
          <div class="right-column">
            <div class="image-placeholder">[Visual representation of the problem]</div>
          </div>
        </div>`,
        
        edtech: `<h2>The Problem</h2>
        <div class="two-column">
          <div class="left-column">
            <p>Education in Africa faces pressing challenges:</p>
            <ul>
              <li>Limited access to quality educational resources</li>
              <li>High student-to-teacher ratios in many regions</li>
              <li>Disconnect between curriculum and job market needs</li>
              <li>High cost of education relative to average income</li>
            </ul>
          </div>
          <div class="right-column">
            <div class="image-placeholder">[Visual representation of the problem]</div>
          </div>
        </div>`,
        
        ecommerce: `<h2>The Problem</h2>
        <div class="two-column">
          <div class="left-column">
            <p>E-commerce in Africa faces significant barriers:</p>
            <ul>
              <li>Logistical challenges with last-mile delivery</li>
              <li>Limited digital payment adoption in many regions</li>
              <li>Trust issues for online purchasing</li>
              <li>Fragmented markets across different countries</li>
            </ul>
          </div>
          <div class="right-column">
            <div class="image-placeholder">[Visual representation of the problem]</div>
          </div>
        </div>`
      };
      return problemContent[sector];
      
    case 'solution':
      const solutionContent = {
        fintech: `<h2>Our Solution</h2>
        <div class="two-column">
          <div class="left-column">
            <p>We're building a comprehensive digital financial platform that:</p>
            <ul>
              <li>Enables seamless cross-border transactions at low cost</li>
              <li>Provides accessible banking services via mobile devices</li>
              <li>Offers alternative credit scoring for the underbanked</li>
              <li>Creates an open API for financial service integration</li>
            </ul>
          </div>
          <div class="right-column">
            <div class="image-placeholder">[Solution Visualization]</div>
          </div>
        </div>`,
        
        agritech: `<h2>Our Solution</h2>
        <div class="two-column">
          <div class="left-column">
            <p>We're building an integrated agricultural platform that:</p>
            <ul>
              <li>Connects farmers directly to buyers, eliminating middlemen</li>
              <li>Provides affordable financing options for agricultural inputs</li>
              <li>Offers weather forecasting and crop management advice</li>
              <li>Optimizes logistics to reduce post-harvest losses</li>
            </ul>
          </div>
          <div class="right-column">
            <div class="image-placeholder">[Solution Visualization]</div>
          </div>
        </div>`,
        
        healthtech: `<h2>Our Solution</h2>
        <div class="two-column">
          <div class="left-column">
            <p>We're building a digital health platform that:</p>
            <ul>
              <li>Enables telemedicine for remote consultations</li>
              <li>Provides electronic health records accessible across providers</li>
              <li>Offers affordable health insurance packages</li>
              <li>Facilitates medication delivery to underserved areas</li>
            </ul>
          </div>
          <div class="right-column">
            <div class="image-placeholder">[Solution Visualization]</div>
          </div>
        </div>`,
        
        edtech: `<h2>Our Solution</h2>
        <div class="two-column">
          <div class="left-column">
            <p>We're building an educational technology platform that:</p>
            <ul>
              <li>Provides accessible, high-quality learning content</li>
              <li>Offers personalized learning paths for students</li>
              <li>Connects learners with job opportunities</li>
              <li>Works both online and offline for areas with limited connectivity</li>
            </ul>
          </div>
          <div class="right-column">
            <div class="image-placeholder">[Solution Visualization]</div>
          </div>
        </div>`,
        
        ecommerce: `<h2>Our Solution</h2>
        <div class="two-column">
          <div class="left-column">
            <p>We're building an e-commerce ecosystem that:</p>
            <ul>
              <li>Streamlines last-mile delivery through local partnerships</li>
              <li>Integrates multiple payment options including mobile money</li>
              <li>Builds trust through escrow and verification systems</li>
              <li>Enables cross-border trade across African markets</li>
            </ul>
          </div>
          <div class="right-column">
            <div class="image-placeholder">[Solution Visualization]</div>
          </div>
        </div>`
      };
      return solutionContent[sector];
      
    case 'market':
      const marketContent = {
        fintech: `<h2>Market Opportunity</h2>
        <div class="two-column">
          <div class="left-column">
            <p><strong>Total Addressable Market (TAM):</strong> $230B</p>
            <p><strong>Serviceable Available Market (SAM):</strong> $85B</p>
            <p><strong>Serviceable Obtainable Market (SOM):</strong> $12B</p>
            <p><strong>Key trends:</strong></p>
            <ul>
              <li>Mobile money users in Africa projected to reach 500M by 2026</li>
              <li>Cross-border payments growing at 15% annually</li>
              <li>Regulatory changes driving financial inclusion initiatives</li>
            </ul>
          </div>
          <div class="right-column">
            <div class="image-placeholder">[Market Size Visualization]</div>
          </div>
        </div>`,
        
        agritech: `<h2>Market Opportunity</h2>
        <div class="two-column">
          <div class="left-column">
            <p><strong>Total Addressable Market (TAM):</strong> $150B</p>
            <p><strong>Serviceable Available Market (SAM):</strong> $65B</p>
            <p><strong>Serviceable Obtainable Market (SOM):</strong> $8B</p>
            <p><strong>Key trends:</strong></p>
            <ul>
              <li>Over 60% of Africa's population is involved in agriculture</li>
              <li>Agricultural output needs to double by 2030 to meet demand</li>
              <li>Digital adoption among farmers growing at 30% annually</li>
            </ul>
          </div>
          <div class="right-column">
            <div class="image-placeholder">[Market Size Visualization]</div>
          </div>
        </div>`,
        
        healthtech: `<h2>Market Opportunity</h2>
        <div class="two-column">
          <div class="left-column">
            <p><strong>Total Addressable Market (TAM):</strong> $175B</p>
            <p><strong>Serviceable Available Market (SAM):</strong> $70B</p>
            <p><strong>Serviceable Obtainable Market (SOM):</strong> $10B</p>
            <p><strong>Key trends:</strong></p>
            <ul>
              <li>Healthcare spending in Africa growing at 10% annually</li>
              <li>Smartphone penetration enabling telemedicine adoption</li>
              <li>Government initiatives for universal healthcare coverage</li>
            </ul>
          </div>
          <div class="right-column">
            <div class="image-placeholder">[Market Size Visualization]</div>
          </div>
        </div>`,
        
        edtech: `<h2>Market Opportunity</h2>
        <div class="two-column">
          <div class="left-column">
            <p><strong>Total Addressable Market (TAM):</strong> $120B</p>
            <p><strong>Serviceable Available Market (SAM):</strong> $50B</p>
            <p><strong>Serviceable Obtainable Market (SOM):</strong> $7B</p>
            <p><strong>Key trends:</strong></p>
            <ul>
              <li>Over 60% of Africa's population is under 25 years old</li>
              <li>Growing smartphone and internet penetration</li>
              <li>Increasing demand for skills-based education</li>
            </ul>
          </div>
          <div class="right-column">
            <div class="image-placeholder">[Market Size Visualization]</div>
          </div>
        </div>`,
        
        ecommerce: `<h2>Market Opportunity</h2>
        <div class="two-column">
          <div class="left-column">
            <p><strong>Total Addressable Market (TAM):</strong> $200B</p>
            <p><strong>Serviceable Available Market (SAM):</strong> $75B</p>
            <p><strong>Serviceable Obtainable Market (SOM):</strong> $11B</p>
            <p><strong>Key trends:</strong></p>
            <ul>
              <li>E-commerce in Africa growing at 25% annually</li>
              <li>Mobile commerce accounting for 70% of online transactions</li>
              <li>Rising middle class with increasing purchasing power</li>
            </ul>
          </div>
          <div class="right-column">
            <div class="image-placeholder">[Market Size Visualization]</div>
          </div>
        </div>`
      };
      return marketContent[sector];
      
    default:
      return `<h2>${capitalizeFirstLetter(slideType)}</h2>
      <p>[Add content for ${slideType} slide]</p>`;
  }
}

async function seedTemplates() {
  // Clear existing templates
  await Template.deleteMany({});
  
  // Define slide templates for each sector
  const sectors = ['fintech', 'agritech', 'healthtech', 'edtech', 'ecommerce'];
  const baseSlides = [
    {
      slideType: 'cover',
      title: 'Cover Slide',
      order: 0
    },
    {
      slideType: 'problem',
      title: 'Problem',
      order: 1
    },
    {
      slideType: 'solution',
      title: 'Solution',
      order: 2
    },
    {
      slideType: 'market',
      title: 'Market Opportunity',
      order: 3
    },
    {
      slideType: 'product',
      title: 'Product',
      order: 4
    },
    {
      slideType: 'traction',
      title: 'Traction',
      order: 5
    },
    {
      slideType: 'business',
      title: 'Business Model',
      order: 6
    },
    {
      slideType: 'competition',
      title: 'Competition',
      order: 7
    },
    {
      slideType: 'team',
      title: 'Team',
      order: 8
    },
    {
      slideType: 'financials',
      title: 'Financials',
      order: 9
    },
    {
      slideType: 'funding',
      title: 'Funding Ask',
      order: 10
    },
    {
      slideType: 'contact',
      title: 'Contact',
      order: 11
    }
  ];
  
  // Create template content for each sector
  for (const sector of sectors) {
    const sectorSlides = baseSlides.map(slide => {
      let content = '';
      
      switch (slide.slideType) {
        case 'cover':
          content = `<div class="slide-center">
            <h1>[Your Company Name]</h1>
            <h3>${capitalizeFirstLetter(sector)} for Africa</h3>
            <p>[Tagline that explains what you do]</p>
            <p class="presenter">[Presenter Name], [Title]</p>
            <p class="date">[Date]</p>
          </div>`;
          break;
          
        case 'problem':
          content = getTemplateContentForSector(sector, 'problem');
          break;
          
        case 'solution':
          content = getTemplateContentForSector(sector, 'solution');
          break;
          
        case 'market':
          content = getTemplateContentForSector(sector, 'market');
          break;
          
        case 'product':
          content = `<h2>Our Product</h2>
          <div class="two-column">
            <div class="left-column">
              <p>Key features:</p>
              <ul>
                <li>[Key feature 1]</li>
                <li>[Key feature 2]</li>
                <li>[Key feature 3]</li>
              </ul>
              <p>Unique advantages:</p>
              <ul>
                <li>[Advantage 1]</li>
                <li>[Advantage 2]</li>
              </ul>
            </div>
            <div class="right-column">
              <div class="image-placeholder">[Product Screenshot or Diagram]</div>
            </div>
          </div>`;
          break;
          
        case 'traction':
          content = `<h2>Traction</h2>
          <div class="two-column">
            <div class="left-column">
              <p><strong>Key metrics:</strong></p>
              <ul>
                <li>[X] users/customers onboarded</li>
                <li>[Y]% monthly growth rate</li>
                <li>[Z] revenue generated to date</li>
              </ul>
              <p><strong>Key partnerships:</strong></p>
              <ul>
                <li>[Partner 1]</li>
                <li>[Partner 2]</li>
              </ul>
            </div>
            <div class="right-column">
              <div class="image-placeholder">[Growth Chart or Metrics Dashboard]</div>
            </div>
          </div>`;
          break;
          
        case 'business':
          content = `<h2>Business Model</h2>
          <div class="two-column">
            <div class="left-column">
              <p><strong>Revenue streams:</strong></p>
              <ul>
                <li>[Revenue stream 1]</li>
                <li>[Revenue stream 2]</li>
                <li>[Revenue stream 3]</li>
              </ul>
              <p><strong>Unit economics:</strong></p>
              <ul>
                <li>Customer acquisition cost (CAC): [Amount]</li>
                <li>Lifetime value (LTV): [Amount]</li>
                <li>LTV:CAC ratio: [Ratio]</li>
              </ul>
            </div>
            <div class="right-column">
              <div class="image-placeholder">[Business Model Canvas or Revenue Breakdown]</div>
            </div>
          </div>`;
          break;
          
        case 'competition':
          content = `<h2>Competitive Landscape</h2>
          <div class="two-column">
            <div class="left-column">
              <p><strong>Key competitors:</strong></p>
              <ul>
                <li>[Competitor 1]</li>
                <li>[Competitor 2]</li>
                <li>[Competitor 3]</li>
              </ul>
              <p><strong>Our competitive advantages:</strong></p>
              <ul>
                <li>[Advantage 1]</li>
                <li>[Advantage 2]</li>
                <li>[Advantage 3]</li>
              </ul>
            </div>
            <div class="right-column">
              <div class="image-placeholder">[Competitive Analysis Matrix]</div>
            </div>
          </div>`;
          break;
          
        case 'team':
          content = `<h2>Our Team</h2>
          <div class="team-grid">
            <div class="team-member">
              <div class="image-placeholder">[Photo]</div>
              <h3>[Name]</h3>
              <p>[Title]</p>
              <p class="small">[Brief background: previous experience, education]</p>
            </div>
            <div class="team-member">
              <div class="image-placeholder">[Photo]</div>
              <h3>[Name]</h3>
              <p>[Title]</p>
              <p class="small">[Brief background: previous experience, education]</p>
            </div>
            <div class="team-member">
              <div class="image-placeholder">[Photo]</div>
              <h3>[Name]</h3>
              <p>[Title]</p>
              <p class="small">[Brief background: previous experience, education]</p>
            </div>
            <div class="team-member">
              <div class="image-placeholder">[Photo]</div>
              <h3>[Name]</h3>
              <p>[Title]</p>
              <p class="small">[Brief background: previous experience, education]</p>
            </div>
          </div>
          <div class="advisors">
            <p><strong>Advisors:</strong> [List key advisors and their affiliations]</p>
          </div>`;
          break;
          
        case 'financials':
          content = `<h2>Financials</h2>
          <div class="two-column">
            <div class="left-column">
              <p><strong>Revenue projections:</strong></p>
              <ul>
                <li>Year 1: [Amount]</li>
                <li>Year 2: [Amount]</li>
                <li>Year 3: [Amount]</li>
              </ul>
              <p><strong>Key financial metrics:</strong></p>
              <ul>
                <li>Gross margin: [Percentage]</li>
                <li>Projected break-even: [Timeline]</li>
                <li>Burn rate: [Amount/month]</li>
              </ul>
            </div>
            <div class="right-column">
              <div class="image-placeholder">[Financial Projection Chart]</div>
            </div>
          </div>`;
          break;
          
        case 'funding':
          content = `<h2>Funding Ask</h2>
          <div class="two-column">
            <div class="left-column">
              <p><strong>Seeking:</strong> [Amount] in [Funding round]</p>
              <p><strong>Use of funds:</strong></p>
              <ul>
                <li>[X]% for [Purpose 1]</li>
                <li>[Y]% for [Purpose 2]</li>
                <li>[Z]% for [Purpose 3]</li>
              </ul>
              <p><strong>Previous funding:</strong> [Details of previous rounds if applicable]</p>
            </div>
            <div class="right-column">
              <div class="image-placeholder">[Use of Funds Chart]</div>
              <p><strong>Key milestones:</strong></p>
              <ul>
                <li>[Milestone 1] by [Date]</li>
                <li>[Milestone 2] by [Date]</li>
              </ul>
            </div>
          </div>`;
          break;
          
        case 'contact':
          content = `<div class="slide-center">
            <h2>Thank You</h2>
            <h3>[Your Company Name]</h3>
            <p><strong>[Founder Name]</strong>, [Title]</p>
            <p>Email: [email@example.com]</p>
            <p>Phone: [+XXX-XXX-XXXX]</p>
            <p>Website: [www.yourcompany.com]</p>
            <div class="social-links">
              <p>[Social Media Links]</p>
            </div>
          </div>`;
          break;
          
        default:
          content = `<h2>${slide.title}</h2><p>[Add content for ${slide.slideType} slide]</p>`;
      }
      
      return {
        ...slide,
        content
      };
    });
    
    // Create the template document
    await Template.create({
      name: `${capitalizeFirstLetter(sector)} Pitch Deck`,
      description: `A comprehensive pitch deck template for ${sector} startups in Africa.`,
      sector,
      slides: sectorSlides
    });
  }
  
  console.log(`Created ${sectors.length} template(s)`);
}

async function seedExamples() {
  // Clear existing examples
  await Example.deleteMany({});
  
  // Create example slides for each sector
  const exampleData = [
    {
      slideType: 'problem',
      sector: 'fintech',
      title: 'Financial Inclusion Problem Example',
      content: `<h2>The Problem: Financial Exclusion</h2>
      <div class="two-column">
        <div class="left-column">
          <p>In Kenya and across East Africa:</p>
          <ul>
            <li>42% of adults remain completely unbanked</li>
            <li>SMEs face a $19B financing gap</li>
            <li>Cross-border transaction fees average 8.9%</li>
            <li>70% of rural population lacks access to formal financial services</li>
          </ul>
          <p><strong>"Banking is still a luxury for millions of Africans"</strong></p>
        </div>
        <div class="right-column">
          <div class="image-placeholder">[Chart showing financial exclusion data across East African countries]</div>
        </div>
      </div>`
    },
    {
      slideType: 'solution',
      sector: 'fintech',
      title: 'Digital Banking Solution Example',
      content: `<h2>Our Solution: AfriBank Digital</h2>
      <div class="two-column">
        <div class="left-column">
          <p>We've built a comprehensive digital banking platform that:</p>
          <ul>
            <li>Enables account opening in under 5 minutes with just a phone number</li>
            <li>Processes cross-border payments at 1/5 the cost of traditional banks</li>
            <li>Uses alternative data for credit scoring (mobile usage, utility payments)</li>
            <li>Works online and offline through USSD for feature phone compatibility</li>
          </ul>
        </div>
        <div class="right-column">
          <div class="image-placeholder">[AfriBank app screenshots showing key features]</div>
        </div>
      </div>`
    },
    {
      slideType: 'problem',
      sector: 'agritech',
      title: 'Agricultural Supply Chain Problem Example',
      content: `<h2>The Problem: Broken Agricultural Supply Chains</h2>
      <div class="two-column">
        <div class="left-column">
          <p>Small-scale farmers in Nigeria face crippling challenges:</p>
          <ul>
            <li>40% of produce lost to post-harvest waste</li>
            <li>Farmers earn only 20-30% of final market price</li>
            <li>90% lack access to formal financing for inputs</li>
            <li>Limited access to market information and modern farming techniques</li>
          </ul>
          <p><strong>"The people who feed our nation are the most vulnerable in our economy"</strong></p>
        </div>
        <div class="right-column">
          <div class="image-placeholder">[Photo of small-scale farmers struggling with produce]</div>
        </div>
      </div>`
    },
    {
      slideType: 'traction',
      sector: 'healthtech',
      title: 'Healthcare Traction Example',
      content: `<h2>Our Traction: Growing Fast</h2>
      <div class="two-column">
        <div class="left-column">
          <p><strong>Key metrics:</strong></p>
          <ul>
            <li>25,000 patients onboarded in first 6 months</li>
            <li>150+ healthcare providers on our platform</li>
            <li>42% month-over-month growth rate</li>
            <li>$350,000 in revenue generated to date</li>
            <li>4.8/5 average user satisfaction rating</li>
          </ul>
          <p><strong>Partnerships:</strong></p>
          <ul>
            <li>Ministry of Health, Rwanda</li>
            <li>Nairobi Women's Hospital Group</li>
            <li>PharmAccess Foundation</li>
          </ul>
        </div>
        <div class="right-column">
          <div class="image-placeholder">[Growth chart showing user acquisition and revenue]</div>
        </div>
      </div>`
    },
    {
      slideType: 'team',
      sector: 'edtech',
      title: 'Education Team Example',
      content: `<h2>Our Team: Educators & Technologists</h2>
      <div class="team-grid">
        <div class="team-member">
          <div class="image-placeholder">[Photo]</div>
          <h3>Dr. Amina Osei</h3>
          <p>CEO & Co-founder</p>
          <p class="small">Former Director of Digital Learning at University of Ghana, PhD in Education Technology from MIT</p>
        </div>
        <div class="team-member">
          <div class="image-placeholder">[Photo]</div>
          <h3>Michael Otieno</h3>
          <p>CTO & Co-founder</p>
          <p class="small">15+ years in software development, previously Engineering Lead at Andela, Computer Science from Stanford</p>
        </div>
        <div class="team-member">
          <div class="image-placeholder">[Photo]</div>
          <h3>Fatima Diallo</h3>
          <p>Head of Content</p>
          <p class="small">Former curriculum developer for Khan Academy, 10+ years in education publishing</p>
        </div>
        <div class="team-member">
          <div class="image-placeholder">[Photo]</div>
          <h3>Samuel Nkosi</h3>
          <p>Head of Partnerships</p>
          <p class="small">Previously led expansion for Bridge International Academies across 5 African countries</p>
        </div>
      </div>
      <div class="advisors">
        <p><strong>Advisors:</strong> Prof. Grace Mwaura (University of Nairobi), David Sengeh (Minister of Education, Sierra Leone), Lisa Phillips (Former VP, Pearson Africa)</p>
      </div>`
    },
    {
      slideType: 'funding',
      sector: 'ecommerce',
      title: 'E-commerce Funding Ask Example',
      content: `<h2>Funding Ask: Series A</h2>
      <div class="two-column">
        <div class="left-column">
          <p><strong>Seeking:</strong> $5 million in Series A funding</p>
          <p><strong>Use of funds:</strong></p>
          <ul>
            <li>40% for expanding logistics network to 5 new countries</li>
            <li>30% for technology development and platform scaling</li>
            <li>20% for marketing and customer acquisition</li>
            <li>10% for working capital and operations</li>
          </ul>
          <p><strong>Previous funding:</strong> $850,000 Seed round (2023) from Local Globe, Ventures Platform, and angel investors</p>
        </div>
        <div class="right-column">
          <div class="image-placeholder">[Use of Funds pie chart]</div>
          <p><strong>Key milestones:</strong></p>
          <ul>
            <li>Expansion to 3 new markets by Q2 2026</li>
            <li>1 million active users by Q4 2026</li>
            <li>Profitability by Q2 2027</li>
          </ul>
        </div>
      </div>`
    },
    {
      slideType: 'market',
      sector: 'edtech',
      title: 'Education Market Example',
      content: `<h2>Market Opportunity: African EdTech</h2>
      <div class="two-column">
        <div class="left-column">
          <p><strong>Total Addressable Market (TAM):</strong> $140B</p>
          <p><strong>Serviceable Available Market (SAM):</strong> $55B</p>
          <p><strong>Serviceable Obtainable Market (SOM):</strong> $8B</p>
          <p><strong>Key market drivers:</strong></p>
          <ul>
            <li>Over 450 million learners under age 18 across Africa</li>
            <li>Internet penetration growing at 20% annually</li>
            <li>70% of employers report skills gap in recent graduates</li>
            <li>Government spending on education increasing by 12% yearly</li>
          </ul>
        </div>
        <div class="right-column">
          <div class="image-placeholder">[Market size breakdown by region and segment]</div>
        </div>
      </div>`
    },
    {
      slideType: 'business',
      sector: 'healthtech',
      title: 'Healthcare Business Model Example',
      content: `<h2>Business Model: Multi-sided Platform</h2>
      <div class="two-column">
        <div class="left-column">
          <p><strong>Revenue streams:</strong></p>
          <ul>
            <li>15% commission on telemedicine consultations</li>
            <li>Monthly subscription for healthcare providers ($50-250/month)</li>
            <li>Health insurance marketplace referral fees (7-12%)</li>
            <li>Data analytics packages for enterprise clients</li>
          </ul>
          <p><strong>Unit economics:</strong></p>
          <ul>
            <li>Customer acquisition cost (CAC): $3.50 per patient</li>
            <li>Lifetime value (LTV): $42 per patient</li>
            <li>LTV:CAC ratio: 12:1</li>
            <li>Gross margin: 78%</li>
          </ul>
        </div>
        <div class="right-column">
          <div class="image-placeholder">[Business model canvas visualization]</div>
        </div>
      </div>`
    }
  ];
  
  // Create examples
  await Example.insertMany(exampleData);
  
  console.log(`Created ${exampleData.length} example(s)`);
}