# JOBFIT - Assess Your Suitability for any Job

JobFit is a helpful AI agent that helps users assess the suitability of a candidate (based on a provided CV) for different jobs.

Simply upload your CV and up to 10 job descriptions and ask questions in natural language!

## Project Set Up

This project uses an Express backend and React frontend to implement a Retrieval-Augmented Generation (RAG) system. Documents are parsed into structured data, embedded using OpenAI, stored in Pinecone, and retrieved to support LLM-based reasoning.

### Installation

Once the project is cloned run ```npm install``` to install all dependencies.

### Environment Variables

Create a .env file with the following variables;

- NODE_ENV=development
- PORT=4000
- OPENAI_API_KEY=sk-proj-yourkeyhere
- PINECONE_API_KEY=pcsk_yourkeyhere
- PINCONE_HOST=https://yourindexsubdomain.pinecone.io

#### API

To build the API run ```npm run build```

To start the API run ```npm run start```

Once up and running, api documentation can be found here:

http://localhost:4000/api-docs/

#### Frontend

To build the frontend run ```cd frontend && npm run build```

To start the frontend run ```npm run preview```

#### Development Mode

Alternatively you can run the app in development mode using ```npm run dev```

This will run both frontend and backend concurrently.

# Notes and Considerations

## Architecture Overview

I chose option 4 for the assessment. It is an interesting tool that I am more likely to revisit and continue developing in my spare time.

The application was created using a Service Oriented Architecture. The backend is modular with clearly defined boundaries between services.

The frontend interacts with the backend only through API calls.

It would be relatively trivial to break into microservices and deploy to a hyper-scalar like AWS but for the purpose of this assignment I've prioritised development speed and simplicity.

## Productionizing

To make this production ready I would;

- Split out the frontend and backend into separate repos and deployments
- Use message queues for some of the heavier processing tasks; parsing the CV and Job Descriptions takes a little longer than a great user experience would encourage
- Make it easier to import job descriptions; plain text, URL parsing (I looked into implementing this briefly but several job boards use CAPTCHA to prevent scraping)
- The system currently doesn't distinguish between users/cvs so I would introduce user accounts and allow a user to have a number of CVs associated to their account

## RAG/LLM Approach & Key Technical Decisions

I initial created a linear flowing system which required the user to;

1. Upload a CV (parses the CV intro a structured format, embed using OpenAI and store in Pinecone)
2. Upload job descriptions (parse job descriptions into a structured format, embed using OpenAI and store in Pinecone )
3. Ask questions (Embed user query using OpenAI, retrieve relevant vectors and associated text from Pinecone, pass query with relevant CV and Job Description text excerpts to OpenAI for reasoning and response generation)

Once the underlying services for each were in place and suitably functional, I created an agent using langgraph which allowed the user interactions to be more circular.

So now a user can;

- Upload job descriptions
- Query the job dscriptions
- Upload a CV
- Ask more questions

The main consideration here was speed of development for a proof of concept.

If I could show how each individual service worked, it would be easier to visualise how the whole agent might work if I ran short of time.

## Engineering Standards

The backend was developed using node but I used TypeScript to keep the codebase as structured as possible using Object Oriented principles and type assertion.

I've tried (hopefully successfully) to keep the code clean and file sizes manageable.

The folders structure is logical and hopefully self documenting - as is the code.

## AI Tools

The backend was mainly developed manually. This is an area I personally like to have control over as I believe if the API/Data Layer are structured correctly it matters less how things around them change. Code completions are used (sparingly) and cursor helps deal with less obvious bugs/erroneous imports due to version changes in libraries.

I also used AI to refine the prompt used to generate responses.

For the frontend my approach is quite the opposite. I do as much as I can with prompts and only dive into the code to make quick text changes or implement logic I need to be particular about. There was none of that in the quick interface which was developed.

## With More Time...

I would come up with a better name to begin with and a more engaging user interface.

Functionally, I'd like to be able to just post URLs or paste some text in to add to the job descriptions under consideration.

I think it would also be a nice feature to create a report per job which the user can review at a glance and create a learning plan to address any skill gaps between where they are and a position they aspire to.

Tying into a few job boards to find jobs that are a suitable fit would also be a good feature.