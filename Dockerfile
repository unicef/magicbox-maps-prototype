# Use the latest node version as a parent image
FROM node:latest

# Set environment variables
ARG REACT_APP_SCHOOLS_URL
ARG REACT_APP_SHAPES_URL
ARG REACT_APP_MAPBOX_TOKEN

# Copy the current directory contents into the container at /opt/react
COPY . /opt/react

# Set the working directory to /opt/react
WORKDIR /opt/react

# Install any needed packages specified in package.json
RUN npm install

# Run the app when the container launches
CMD npm start
