# encoding: UTF-8
require 'sinatra'   
require 'sinatra/json'

get '/' do
  "Hello clock!"
end

get '/clock_callback/:clock_id' do 
	params["hub.challenge"]
end

post '/clock_callback/:clock_id' do 
	
end





# c8ef24044b394ea0b11dbfd34dbffa45
# 0b321ddbe9864840a0472b4a8a15e380